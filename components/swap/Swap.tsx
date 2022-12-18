import { useState, useContext, useMemo } from "react"

import styles from "./Swap.module.css"
import SellInput from "./sellInput/SellInput"
import BuyInput from "./buyInput/BuyInput"
import Modal from "./modal/Modal"
import TransactionSettings from "./transactionSettings/TransactionSettings"
import SwapButton from "./swapButton/SwapButton"

import { ExchangeContext, ZZTokenInfo } from "../../contexts/ExchangeContext"
import { WalletContext } from "../../contexts/WalletContext"
import { SwapContext } from "../../contexts/SwapContext"
import { hideAddress, prettyBalance, prettyBalanceUSD } from "../../utils/utils"
import { constants, ethers } from "ethers"
import { INFO_ICON } from "../../public/commonIcons"
import Separator from "./separator/Separator"
import DownArrow from "../DownArrow"
import useTranslation from "next-translate/useTranslation"

export enum ValidationState {
  OK,
  IsNaN,
  IsNegative,
  InsufficientBalance,
  ExceedsAllowance,
  InternalError,
  MissingLiquidity,
}

function Swap() {
  console.log("SWAP RENDER")
  const { network, userAddress } = useContext(WalletContext)
  const { allowances, balances, buyTokenInfo, sellTokenInfo, tokenPricesUSD, setBuyToken, setSellToken } = useContext(ExchangeContext)
  const { sellAmount, buyAmount, swapPrice, switchTokens, setSellInput } = useContext(SwapContext)

  const [modal, setModal] = useState<"buy" | "sell" | null>(null)

  const { t } = useTranslation("swap")

  const getBalanceReadable = (tokenAddress: string | null) => {
    if (tokenAddress && balances[tokenAddress]) {
      return prettyBalance(balances[tokenAddress].valueReadable)
    } else {
      return "0.0"
    }
  }

  const validationStateSell = useMemo((): ValidationState => {
    if (!userAddress) return ValidationState.OK

    if (isNaN(sellAmount)) return ValidationState.IsNaN
    if (sellAmount < 0) return ValidationState.IsNegative
    if (!sellTokenInfo) return ValidationState.InternalError

    const amountString = String(sellAmount)
    if (amountString === "") return ValidationState.IsNaN
    if (!swapPrice) return ValidationState.MissingLiquidity

    const balance = balances[sellTokenInfo.address] ? balances[sellTokenInfo.address].value : ethers.constants.Zero
    if (balance === null) return ValidationState.InsufficientBalance

    const amountBN = ethers.utils.parseUnits(amountString, sellTokenInfo.decimals)
    if (amountBN.gt(balance)) return ValidationState.InsufficientBalance

    const allowance = allowances[sellTokenInfo.address] ? allowances[sellTokenInfo.address] : ethers.constants.Zero
    if (allowance !== null && allowance !== undefined && amountBN.gt(allowance)) {
      return ValidationState.ExceedsAllowance
    }

    return ValidationState.OK
  }, [userAddress, swapPrice, sellAmount, allowances, balances, sellTokenInfo])

  const validationStateBuy = useMemo((): ValidationState => {
    if (!userAddress) return ValidationState.OK

    if (isNaN(buyAmount)) return ValidationState.IsNaN
    if (buyAmount < 0) return ValidationState.IsNegative

    const amountString = String(buyAmount)
    if (amountString === "") return ValidationState.IsNaN
    if (!buyTokenInfo) return ValidationState.InternalError

    return ValidationState.OK
  }, [userAddress, buyAmount, buyTokenInfo])

  const getErrorMessage = (validationState: ValidationState) => {
    if (!userAddress) return

    switch (validationState) {
      case ValidationState.ExceedsAllowance:
        return "Amount exceeds allowance."
      case ValidationState.InsufficientBalance:
        return "Amount exceeds balance."
      case ValidationState.InternalError:
        return "Internal error."
      case ValidationState.IsNaN:
        return "Amount cannot be NaN."
      case ValidationState.IsNegative:
        return "Amount cannot be negative."
      case ValidationState.MissingLiquidity:
        return "Not enough liquidity"
      default:
        return
    }
  }

  function _switchTokens() {
    if (buyTokenInfo) setSellToken(buyTokenInfo.address)
    if (sellTokenInfo) setBuyToken(sellTokenInfo.address)
    switchTokens()
  }

  const handleTokenClick = (newTokenAddress: string) => {
    if (modal === "sell") {
      if (newTokenAddress === buyTokenInfo?.address) {
        _switchTokens()
      } else {
        setSellInput("")
        setSellToken(newTokenAddress)
      }
    } else if (modal === "buy") {
      if (newTokenAddress === sellTokenInfo?.address) {
        _switchTokens()
      } else {
        setBuyToken(newTokenAddress)
      }
    }
    setModal(null)
  }

  const buyTokenSymbol = buyTokenInfo?.symbol ? buyTokenInfo?.symbol : "Token"
  const sellTokenSymbol = sellTokenInfo?.symbol ? sellTokenInfo?.symbol : "Token"

  const buyTokenAddress = buyTokenInfo?.address ? buyTokenInfo?.address : null
  const sellTokenAddress = sellTokenInfo?.address ? sellTokenInfo?.address : null

  const buyTokenUsdPrice = buyTokenAddress && tokenPricesUSD[buyTokenAddress] ? tokenPricesUSD[buyTokenAddress] : undefined
  const sellTokenUsdPrice = sellTokenAddress && tokenPricesUSD[sellTokenAddress] ? tokenPricesUSD[sellTokenAddress] : undefined

  // Estimated sell token value
  let sellTokenEstimatedValue
  if (sellTokenUsdPrice !== undefined && sellAmount !== 0) {
    sellTokenEstimatedValue = <div className={styles.estimated_value}>{`~$${prettyBalanceUSD(sellAmount * sellTokenUsdPrice)}`}</div>
  }

  // Estimated buy token value
  let buyTokenEstimatedValue
  if (buyTokenUsdPrice !== undefined && buyAmount !== 0) {
    let percent
    if (sellTokenUsdPrice !== undefined && sellAmount !== 0)
      percent = `(${prettyBalanceUSD(buyAmount * buyTokenUsdPrice - sellAmount * sellTokenUsdPrice)}%)`

    buyTokenEstimatedValue = <div className={styles.estimated_value}>{`~$${prettyBalanceUSD(buyAmount * buyTokenUsdPrice)} ${percent}`}</div>
  }

  // Error messages
  const sellErrorMessage = getErrorMessage(validationStateSell)
  const sellErrorElement = <div className={styles.error_element}>{sellErrorMessage}</div>
  const buyErrorMessage = getErrorMessage(validationStateBuy)
  const buyErrorElement = <div className={styles.error_element}>{buyErrorMessage}</div>

  return (
    <div className={styles.container}>
      <div className={styles.from_to_container}>
        <h1 className={styles.title}>{t("swap")}</h1>

        <div className={styles.from_container}>
          <div className={styles.from_header}>
            <div className={styles.from_title}> From</div>
            <div className={styles.from_balance}>
              {getBalanceReadable(sellTokenAddress)} {sellTokenSymbol}
            </div>
          </div>
          <div className={styles.from_input_container}>
            <SellInput
              sellTokenInfo={sellTokenInfo}
              balance={sellTokenAddress && balances[sellTokenAddress] ? balances[sellTokenAddress].value : ethers.constants.Zero}
              validationStateSell={validationStateSell}
              openModal={() => setModal("sell")}
            />
          </div>
          <div className={styles.below_input_container}>
            {sellErrorElement}
            <div className={styles.value_container}>{sellTokenEstimatedValue}</div>
          </div>
          <TokenInfoDisplay tokenInfo={sellTokenInfo} />
        </div>

        <Separator onClick={_switchTokens} />

        <div className={styles.to_container}>
          <div className={styles.to_header}>
            <div className={styles.to_title}> To</div>
            <div className={styles.to_balance}>
              {getBalanceReadable(buyTokenAddress)} {buyTokenSymbol}
            </div>
          </div>
          <div className={styles.to_input_container}>
            <BuyInput buyTokenInfo={buyTokenInfo} validationStateBuy={validationStateBuy} openModal={() => setModal("buy")} />
          </div>
          <div className={styles.below_input_container}>
            {buyErrorElement}
            <div className={styles.value_container}>{buyTokenEstimatedValue}</div>
          </div>
          <TokenInfoDisplay tokenInfo={buyTokenInfo} />
        </div>
      </div>

      <SwapButton validationStateBuy={validationStateBuy} validationStateSell={validationStateSell} />

      <TransactionSettings
        buySymbol={buyTokenSymbol}
        sellSymbol={sellTokenSymbol}
        priceBuy={`${swapPrice !== 0 && Number.isFinite(swapPrice) ? prettyBalance(1 / swapPrice) : prettyBalance(0)}`}
        priceSell={`${prettyBalance(swapPrice)}`}
        priceBuyUsd={buyTokenUsdPrice}
        priceSellUsd={sellTokenUsdPrice}
        nativeCurrencyUsd={tokenPricesUSD[constants.AddressZero] ? tokenPricesUSD[constants.AddressZero] : 0}
        nativeCurrencySymbol={network?.nativeCurrency?.symbol ? network.nativeCurrency.symbol : "ETH"}
      />

      <Modal
        isOpen={modal !== null}
        selectedModal={modal}
        onTokenClick={(tokenAddress: string) => handleTokenClick(tokenAddress)}
        close={() => setModal(null)}
      />
    </div>
  )
}

export default Swap

function TokenInfoDisplay({ tokenInfo }: { tokenInfo: ZZTokenInfo }) {
  const [isOpen, setIsOpen] = useState<boolean>(false)

  return (
    <div className={styles.sell_token_info}>
      <div style={{ display: "flex", cursor: "pointer" }} onClick={() => setIsOpen(o => !o)}>
        Details <DownArrow up={isOpen} />
      </div>
      {isOpen ? (
        <>
          <div>Address: {parseInt(tokenInfo.address, 16) === 0 ? "Native" : tokenInfo.address}</div>
          <div>Decimals: {tokenInfo.decimals}</div>
        </>
      ) : null}
    </div>
  )
}

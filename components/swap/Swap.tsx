import { useState, useContext, useMemo } from "react"

import styles from "./Swap.module.css"
import SellInput from "./sellInput/SellInput"
import BuyInput from "./buyInput/BuyInput"
import Modal, { ModalMode } from "./modal/Modal"
import TransactionSettings from "./transactionSettings/TransactionSettings"
import SwapButton from "./swapButton/SwapButton"

import { ExchangeContext, ZZTokenInfo } from "../../contexts/ExchangeContext"
import { WalletContext } from "../../contexts/WalletContext"
import { SwapContext } from "../../contexts/SwapContext"
import { prettyBalance, prettyBalanceUSD, truncateDecimals } from "../../utils/utils"
import { constants, ethers } from "ethers"
import Separator from "./separator/Separator"
import DownArrow from "../DownArrow"
import useTranslation from "next-translate/useTranslation"
import Link from "next/link"
import { NetworkType } from "../../data/networks"

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

  const [modal, setModal] = useState<ModalMode>(null)

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
    if (!sellTokenInfo) return ValidationState.InternalError
    if (!swapPrice) return ValidationState.MissingLiquidity

    const balance = balances[sellTokenInfo.address] ? balances[sellTokenInfo.address].value : ethers.constants.Zero
    if (balance === null) return ValidationState.InsufficientBalance
    if (sellAmount.gt(balance)) return ValidationState.InsufficientBalance

    const allowance = allowances[sellTokenInfo.address] ? allowances[sellTokenInfo.address] : ethers.constants.Zero
    if (allowance !== null && allowance !== undefined && sellAmount.gt(allowance)) {
      return ValidationState.ExceedsAllowance
    }

    return ValidationState.OK
  }, [userAddress, swapPrice, sellAmount, allowances, balances, sellTokenInfo])

  const validationStateBuy = useMemo((): ValidationState => {
    if (!userAddress) return ValidationState.OK
    if (!buyTokenInfo) return ValidationState.InternalError

    return ValidationState.OK
  }, [userAddress, buyTokenInfo])

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
    if (modal === "selectSellToken") {
      if (newTokenAddress === buyTokenInfo?.address) {
        _switchTokens()
      } else {
        setSellInput("")
        setSellToken(newTokenAddress)
      }
    } else if (modal === "selectBuyToken") {
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
  const sellTokenEstimatedValue: any = useMemo(() => {
    if (sellTokenUsdPrice !== undefined) {
      const sellAmountFormated = Number(ethers.utils.formatUnits(sellAmount, sellTokenInfo.decimals))
      if (sellAmountFormated === 0) return
      return <div className={styles.estimated_value}>{`~$${prettyBalanceUSD(sellAmountFormated * sellTokenUsdPrice)}`}</div>
    }
  }, [sellTokenInfo, sellAmount, sellTokenUsdPrice])

  // Estimated buy token value
  const buyTokenEstimatedValue: any = useMemo(() => {
    if (buyTokenUsdPrice !== undefined) {
      const buyAmountFormated = Number(ethers.utils.formatUnits(buyAmount, buyTokenInfo.decimals))
      if (buyAmountFormated === 0) return

      let percent
      if (sellTokenUsdPrice !== undefined) {
        const sellAmountFormated = Number(ethers.utils.formatUnits(sellAmount, sellTokenInfo.decimals))
        if (sellAmountFormated === 0) {
          return <div className={styles.estimated_value}>{`~$${prettyBalanceUSD(buyAmountFormated * buyTokenUsdPrice)}`}</div>
        }
        percent = `(${prettyBalanceUSD(buyAmountFormated * buyTokenUsdPrice - sellAmountFormated * sellTokenUsdPrice)}%)`
      }
      return <div className={styles.estimated_value}>{`~$${prettyBalanceUSD(buyAmountFormated * buyTokenUsdPrice)} ${percent}`}</div>
    }
    return
  }, [sellTokenInfo, buyTokenInfo, sellAmount, buyAmount, sellTokenUsdPrice, buyTokenUsdPrice])

  // Error messages
  // const sellErrorMessage = getErrorMessage(validationStateSell)
  // const sellErrorElement = <div className={styles.error_element}>{sellErrorMessage}</div>
  // const buyErrorMessage = getErrorMessage(validationStateBuy)
  // const buyErrorElement = <div className={styles.error_element}>{buyErrorMessage}</div>

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
              openSellTokenSelectModal={() => setModal("selectSellToken")}
            />
          </div>
          <div className={styles.below_input_container}>
            <ExplorerButton network={network} token={sellTokenInfo} />
            <div className={styles.value_container}>{sellTokenEstimatedValue}</div>
          </div>
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
            <BuyInput
              buyTokenInfo={buyTokenInfo}
              validationStateBuy={validationStateBuy}
              openBuyTokenSelectModal={() => setModal("selectBuyToken")}
            />
          </div>
          <div className={styles.below_input_container}>
            <ExplorerButton network={network} token={buyTokenInfo} />
            <div className={styles.value_container}>{buyTokenEstimatedValue}</div>
          </div>
        </div>
      </div>

      <SwapButton
        validationStateBuy={validationStateBuy}
        validationStateSell={validationStateSell}
        openSwapModal={() => setModal("swap")}
        openApproveModal={() => setModal("approve")}
        openWrapModal={() => setModal("wrap")}
        openUnwrapModal={() => setModal("unwrap")}
        closeModal={() => setModal(null)}
      />

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

      <Modal selectedModal={modal} onTokenClick={(tokenAddress: string) => handleTokenClick(tokenAddress)} close={() => setModal(null)} />
    </div>
  )
}

export default Swap

function ExplorerButton({ network, token }: { network: NetworkType | null; token: ZZTokenInfo | null }) {
  if (network && token) {
    if (token.address === "0x0000000000000000000000000000000000000000") {
      return <a className={styles.native_token}>Native Token</a>
    }
    return (
      <a className={styles.see_in_explorer_link} href={`${network.explorerUrl}/token/${token.address}`} target="_blank" rel="noopener noreferrer">
        See in Explorer
      </a>
    )
  } else return null
}

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
import { ethers } from "ethers"
import Separator from "./separator/Separator"
import useTranslation from "next-translate/useTranslation"
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
  const { allowances, balances, buyTokenInfo, sellTokenInfo, tokenPricesUSD } = useContext(ExchangeContext)
  const { sellAmount, buyAmount, swapPrice, selectSellToken, selectBuyToken } = useContext(SwapContext)

  const [modal, setModal] = useState<ModalMode>(null)

  const { t } = useTranslation("swap")

  const getBalanceReadable = (tokenAddress: string | null) => {
    if (tokenAddress === null) return "0.0"
    const tokenBalance = balances[tokenAddress]
    if (tokenBalance === undefined) return "0.0"
    return prettyBalance(tokenBalance.valueReadable)
  }

  const validationStateSell = useMemo((): ValidationState => {
    if (!userAddress) return ValidationState.OK
    if (!sellTokenInfo) return ValidationState.InternalError
    if (!swapPrice) return ValidationState.MissingLiquidity

    const sellTokenBalance = balances[sellTokenInfo.address]
    const balance = sellTokenBalance ? sellTokenBalance.value : ethers.constants.Zero
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

  const handleTokenClick = (newTokenAddress: string) => {
    if (modal === "selectSellToken") {
      selectSellToken(newTokenAddress)
    } else if (modal === "selectBuyToken") {
      selectBuyToken(newTokenAddress)
    }
    setModal(null)
  }

  const buyTokenUsdPrice = tokenPricesUSD[buyTokenInfo.address]
  const sellTokenUsdPrice = tokenPricesUSD[sellTokenInfo.address]

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
            <div className={styles.from_title}>{t("from")}</div>
            <div className={styles.from_balance}>
              {getBalanceReadable(sellTokenInfo.address)} {buyTokenInfo.symbol}
            </div>
          </div>
          <div className={styles.from_input_container}>
            <SellInput validationStateSell={validationStateSell} openSellTokenSelectModal={() => setModal("selectSellToken")} />
          </div>
          <div className={styles.below_input_container}>
            <ExplorerButton network={network} token={sellTokenInfo} />
            <div className={styles.value_container}>{sellTokenEstimatedValue}</div>
          </div>
        </div>

        <Separator />

        <div className={styles.to_container}>
          <div className={styles.to_header}>
            <div className={styles.to_title}>{t("to")}</div>
            <div className={styles.to_balance}>
              {getBalanceReadable(buyTokenInfo.address)} {sellTokenInfo.symbol}
            </div>
          </div>
          <div className={styles.to_input_container}>
            <BuyInput validationStateBuy={validationStateBuy} openBuyTokenSelectModal={() => setModal("selectBuyToken")} />
          </div>
          <div className={styles.below_input_container}>
            <ExplorerButton network={network} token={buyTokenInfo} />
            <div className={styles.value_container}>{buyTokenEstimatedValue}</div>
          </div>
        </div>

        <TransactionSettings />
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

      <Modal selectedModal={modal} onTokenClick={(tokenAddress: string) => handleTokenClick(tokenAddress)} close={() => setModal(null)} />
    </div>
  )
}

export default Swap

function ExplorerButton({ network, token }: { network: NetworkType | null; token: ZZTokenInfo | null }) {
  const { t } = useTranslation("common")

  if (network && token) {
    if (token.address === "0x0000000000000000000000000000000000000000") {
      return <a className={styles.native_token}>{t("native_token")}</a>
    }
    return (
      <a className={styles.see_in_explorer_link} href={`${network.explorerUrl}/token/${token.address}`} target="_blank" rel="noopener noreferrer">
        {t("view_in_explorer")}
      </a>
    )
  } else return null
}

import { useState, useContext, useMemo } from "react"

import styles from "./Swap.module.css"
import SellInput from "./sellInput/SellInput"
import BuyInput from "./buyInput/BuyInput"
import Modal, { ModalMode } from "./modal/Modal"
import TransactionSettings from "./transactionSettings/TransactionSettings"
import SwapButton from "./swapButton/SwapButton"

import { ExchangeContext, ZZTokenInfo } from "../../contexts/ExchangeContext"
import { WalletContext } from "../../contexts/WalletContext"
import { SwapContext, ZZOrder } from "../../contexts/SwapContext"
import { prettyBalance, prettyBalanceUSD } from "../../utils/utils"
import { constants, ethers } from "ethers"
import Separator from "./separator/Separator"
import useTranslation from "next-translate/useTranslation"
import { NetworkType } from "../../data/networks"

export enum SellValidationState {
  OK,
  IsNaN,
  IsNegative,
  InsufficientBalance,
  ExceedsAllowance,
  InternalError,
  MissingLiquidity,
}

export enum BuyValidationState {
  OK,
  InternalError,
}

function Swap() {
  console.log("SWAP RENDER")
  const { network, userAddress } = useContext(WalletContext)
  const { allowances, balances, buyTokenInfo, sellTokenInfo, tokenPricesUSD } = useContext(ExchangeContext)
  const { sellAmount, buyAmount, swapPrice, quoteOrderRoutingArray, selectSellToken, selectBuyToken } = useContext(SwapContext)

  const [modal, setModal] = useState<ModalMode>(null)

  const { t } = useTranslation("swap")

  const getBalanceReadable = (tokenAddress: string | null) => {
    if (tokenAddress === null) return "0.0"
    const tokenBalance = balances[tokenAddress]
    if (tokenBalance === undefined) return "0.0"
    return prettyBalance(tokenBalance.valueReadable)
  }

  const validationStateSell = useMemo((): SellValidationState => {
    if (!userAddress) return SellValidationState.OK
    if (!sellTokenInfo) return SellValidationState.InternalError
    if (!swapPrice) return SellValidationState.MissingLiquidity

    const firstQuoteOrder: ZZOrder | undefined = quoteOrderRoutingArray[0]
    if (!firstQuoteOrder || sellAmount.gt(firstQuoteOrder.order.buyAmount)) {
      return SellValidationState.MissingLiquidity
    }

    const sellTokenBalance = balances[sellTokenInfo.address]
    const balance = sellTokenBalance ? sellTokenBalance.value : ethers.constants.Zero
    if (balance === null) return SellValidationState.InsufficientBalance
    if (sellAmount.gt(balance)) return SellValidationState.InsufficientBalance

    const allowance = allowances[sellTokenInfo.address] ? allowances[sellTokenInfo.address] : ethers.constants.Zero
    if (allowance !== null && allowance !== undefined && sellAmount.gt(allowance)) {
      return SellValidationState.ExceedsAllowance
    }

    return SellValidationState.OK
  }, [userAddress, swapPrice, sellAmount, allowances, balances, sellTokenInfo])

  const validationStateBuy = useMemo((): BuyValidationState => {
    if (!userAddress) return BuyValidationState.OK
    if (!buyTokenInfo) return BuyValidationState.InternalError

    return BuyValidationState.OK
  }, [userAddress, buyTokenInfo])

  const handleTokenClick = (newTokenAddress: string) => {
    if (modal === "selectSellToken") {
      selectSellToken(newTokenAddress)
    } else if (modal === "selectBuyToken") {
      selectBuyToken(newTokenAddress)
    }
    setModal(null)
  }

  const sellTokenUsdPrice = sellTokenInfo ? tokenPricesUSD[sellTokenInfo.address] : undefined
  const buyTokenUsdPrice = buyTokenInfo ? tokenPricesUSD[buyTokenInfo.address] : undefined

  // Estimated sell token value
  const sellTokenEstimatedValue = useMemo(() => {
    if (sellTokenUsdPrice !== undefined) {
      if (!sellTokenInfo) return
      const sellAmountFormated = Number(ethers.utils.formatUnits(sellAmount, sellTokenInfo.decimals))
      if (sellAmountFormated === 0) return
      return <div className={styles.estimated_value}>{`~$${prettyBalanceUSD(sellAmountFormated * sellTokenUsdPrice)}`}</div>
    }
  }, [sellTokenInfo, sellAmount, sellTokenUsdPrice])

  // Estimated buy token value
  const buyTokenEstimatedValue = useMemo(() => {
    if (!buyTokenInfo) return
    if (buyTokenUsdPrice !== undefined) {
      const buyAmountFormated = Number(ethers.utils.formatUnits(buyAmount, buyTokenInfo.decimals))
      if (buyAmountFormated === 0) return

      const buyTokenValue = buyAmountFormated * buyTokenUsdPrice
      let percent
      if (sellTokenUsdPrice !== undefined) {
        if (!sellTokenInfo) return
        const sellAmountFormated = Number(ethers.utils.formatUnits(sellAmount, sellTokenInfo.decimals))
        if (sellAmountFormated === 0) {
          return <div className={styles.estimated_value}>{`~$${prettyBalanceUSD(buyTokenValue)}`}</div>
        }
        const sellTokenValue = sellAmountFormated * sellTokenUsdPrice
        percent = `(${prettyBalanceUSD((buyTokenValue - sellTokenValue) * 100 / sellTokenValue)}%)`
      }
      return <div className={styles.estimated_value}>{`~$${prettyBalanceUSD(buyTokenValue)} ${percent}`}</div>
    }
    return
  }, [sellTokenInfo, buyTokenInfo, sellAmount, buyAmount, sellTokenUsdPrice, buyTokenUsdPrice])

  return (
    <div className={styles.container}>
      <div className={styles.from_to_container}>
        <h1 className={styles.title}>{t("swap")}</h1>

        <div className={styles.from_container}>
          <div className={styles.from_header}>
            <div className={styles.from_title}>{t("from")}</div>
            <div className={styles.from_balance}>{sellTokenInfo ? `${getBalanceReadable(sellTokenInfo.address)} ${sellTokenInfo.symbol}` : null}</div>
          </div>
          <div className={styles.from_input_container}>
            <SellInput openSellTokenSelectModal={() => setModal("selectSellToken")} />
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
            <div className={styles.to_balance}>{buyTokenInfo ? `${getBalanceReadable(buyTokenInfo.address)} ${buyTokenInfo.symbol}` : null}</div>
          </div>
          <div className={styles.to_input_container}>
            <BuyInput openBuyTokenSelectModal={() => setModal("selectBuyToken")} />
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
    if (token.address === constants.AddressZero) {
      return <a className={styles.native_token}>{t("native_token")}</a>
    }
    return (
      <a className={styles.see_in_explorer_link} href={`${network.explorerUrl}/token/${token.address}`} target="_blank" rel="noopener noreferrer">
        {t("view_in_explorer")}
      </a>
    )
  } else return null
}

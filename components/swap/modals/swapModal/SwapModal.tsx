import { utils } from "ethers"
import Image from "next/image"
import { useContext, useEffect } from "react"
import { ExchangeContext, ZZTokenInfo } from "../../../../contexts/ExchangeContext"
import { SwapContext } from "../../../../contexts/SwapContext"
import useCountdown from "../../../../hooks/useCountdown"
import { parseError, prettyBalance } from "../../../../utils/utils"
import TransactionProgress from "../../../transactionProgress/TransactionProgress"
import styles from "./SwapModal.module.css"

interface Props {
  close: () => void
}

export default function SwapModal({ close }: Props) {
  const { balances, markets, buyTokenInfo, sellTokenInfo, tokenPricesUSD, getTokens, getTokenInfo, setBuyToken } = useContext(ExchangeContext)
  const { transactionStatus, transactionError, sellAmount, buyAmount, quoteOrder } = useContext(SwapContext)
  const countdown = useCountdown(quoteOrder?.order.expirationTimeSeconds ? Number(quoteOrder?.order.expirationTimeSeconds) - 3 : undefined)

  let errorMessage
  if (transactionError) errorMessage = parseError(transactionError)
  // if (transactionError) {
  //   if (transactionError.hasOwnProperty("message")) {
  //     if (transactionError.message.includes("user rejected transaction") || transactionError.message.includes("Cannot set properties of undefined")) {
  //       errorMessage = "Transaction rejected by the user."
  //     } else {
  //       errorMessage = transactionError.message
  //     }
  //   }
  // }

  let message
  if (transactionStatus === "awaitingWallet") {
    if (countdown !== undefined && countdown > 0) {
      message = `Confirm within ${countdown} seconds`
    } else {
      message = "Quote expired. Please cancel the current transaction as it will fail."
    }
  } else if (transactionStatus === "processing") {
    message = "Transaction confirmed. Processing..."
  } else {
    message = "Token swapped."
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        Swapping {sellTokenInfo.symbol} for {buyTokenInfo.symbol}
      </div>
      <hr className={styles.hr} />
      <div className={styles.transaction_progress_container}>
        <TransactionProgress
          status={transactionStatus}
          failed={transactionError !== null || countdown === undefined || (transactionStatus === "awaitingWallet" && countdown <= 0)}
        />
      </div>
      <div className={styles.buy_sell_tokens}>
        <div className={styles.sell_token}>
          {prettyBalance(utils.formatUnits(sellAmount, sellTokenInfo.decimals))}{" "}
          <div className={styles.token_symbol}>
            <Image src={`/tokenIcons/${sellTokenInfo.symbol.toLocaleLowerCase()}.svg`} width="100%" height="100%" layout="intrinsic" />
          </div>
        </div>
        <div className={styles.arrow}>🢒</div>
        <div className={styles.buy_token}>
          {prettyBalance(utils.formatUnits(buyAmount, buyTokenInfo.decimals))}
          <div className={styles.token_symbol}>
            <Image src={`/tokenIcons/${buyTokenInfo.symbol.toLocaleLowerCase()}.svg`} width="100%" height="100%" layout="intrinsic" />
          </div>
        </div>
      </div>
      <div className={styles.text}>{errorMessage ? errorMessage : message}</div>
    </div>
  )
}

import { utils } from "ethers"
import Image from "next/image"
import { useContext, useEffect } from "react"
import { ExchangeContext, ZZTokenInfo } from "../../../../contexts/ExchangeContext"
import { SwapContext } from "../../../../contexts/SwapContext"
import useCountdown from "../../../../hooks/useCountdown"
import { parseError, prettyBalance } from "../../../../utils/utils"
import TransactionProgress from "../../../transactionProgress/TransactionProgress"
import styles from "./WrapModal.module.css"

interface Props {
  close: () => void
}

export default function WrapModal({ close }: Props) {
  const { balances, markets, buyTokenInfo, sellTokenInfo, tokenPricesUSD, getTokens, getTokenInfo, setBuyToken } = useContext(ExchangeContext)
  const { transactionStatus, transactionError, sellAmount, buyAmount, quoteOrder } = useContext(SwapContext)

  const errorMessage = transactionError ? parseError(transactionError) : undefined

  let message
  if (transactionStatus === "awaitingWallet") {
    message = "Awaiting wallet confirmation..."
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
        <TransactionProgress status={transactionStatus} failed={transactionError !== null} />
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

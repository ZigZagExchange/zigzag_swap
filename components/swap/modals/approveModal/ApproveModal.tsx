import { useContext } from "react"
import { ExchangeContext } from "../../../../contexts/ExchangeContext"
import { SwapContext } from "../../../../contexts/SwapContext"
import { parseError } from "../../../../utils/utils"
import TransactionProgress from "../../../transactionProgress/TransactionProgress"
import styles from "./ApproveModal.module.css"

interface Props {
  close: () => void
}

export default function ApproveModal({ close }: Props) {
  const { sellTokenInfo } = useContext(ExchangeContext)
  const { transactionStatus, transactionError } = useContext(SwapContext)

  const errorMessage = transactionError ? parseError(transactionError) : undefined

  let message
  if (transactionStatus === "awaitingWallet") {
    message = "Awaiting wallet confirmation..."
  } else if (transactionStatus === "processing") {
    message = "Transaction confirmed. Processing..."
  } else {
    message = "Token approved."
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>Approving {sellTokenInfo.symbol}</div>
      <hr className={styles.hr} />
      <div className={styles.transaction_progress_container}>
        <TransactionProgress status={transactionStatus} failed={transactionError !== null} />
      </div>
      <div className={styles.text}>{errorMessage ? errorMessage : message}</div>
    </div>
  )
}

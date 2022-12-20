import { CSSProperties } from "react"
import { TransactionStatus } from "../../contexts/SwapContext"
import styles from "./TransactionProgress.module.css"

interface Props {
  status: TransactionStatus
  failed: boolean
}

export default function TransactionProgress({ status, failed }: Props) {
  switch (status) {
    case "awaitingWallet":
      return (
        <div className={styles.container} style={{ "--stage": 0 } as CSSProperties}>
          <div className={`${styles.stage} ${failed ? styles.failed : styles.pending}`}></div>
          <div className={styles.stage}></div>
          <div className={styles.stage}></div>
        </div>
      )
    case "processing":
      return (
        <div className={styles.container} style={{ "--stage": 1 } as CSSProperties}>
          <div className={`${styles.stage} ${styles.complete}`}></div>
          <div className={`${styles.stage} ${failed ? styles.failed : styles.pending}`}></div>
          <div className={styles.stage}></div>
        </div>
      )
    case "processed":
      return (
        <div className={styles.container} style={{ "--stage": 2 } as CSSProperties}>
          <div className={`${styles.stage} ${styles.complete}`}></div>
          <div className={`${styles.stage} ${styles.complete}`}></div>
          <div className={`${styles.stage} ${styles.complete}`}></div>
        </div>
      )
    default:
      return <div>TransactionProgress</div>
  }
}

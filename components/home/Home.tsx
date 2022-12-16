import Link from "next/link"
import styles from "./Home.module.css"

export default function Home() {
  return (
    <div className={styles.container}>
      <Link href="/swap">
        <a className={styles.button}>Swap</a>
      </Link>

      <Link href="https://trade.zigzag.exchange/">
        <a className={styles.button}>Orderbook</a>
      </Link>
    </div>
  )
}

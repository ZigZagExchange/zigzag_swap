import styles from "./TokenListEntry.module.css"

interface Props {
  selected: boolean
  symbol: string
  balance: string
  usdValue: string
  onClick: () => void
}

function TokenListEntry({ selected, symbol, balance, usdValue, onClick }: Props) {
  return (
    <div className={`${styles.container} ${selected ? styles.selected : ""}`} onClick={onClick}>
      <div className={styles.icon_symbol_container}>
        <div className={styles.icon} />
        <div>{symbol}</div>
      </div>
      <div className={styles.value_container}>
        <div className={styles.balance}>{balance}</div>
        <div className={styles.usd_value}>{usdValue}</div>
      </div>
    </div>
  )
}

export default TokenListEntry

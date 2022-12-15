import Image from "next/image"
import styles from "./TokenListEntry.module.css"

interface Props {
  selected: boolean
  symbol: string
  address: string
  name: string
  balance: string
  usdValue: string
  onClick: () => void
}

function TokenListEntry({ selected, symbol, address, name, balance, usdValue, onClick }: Props) {
  return (
    <div className={`${styles.container} ${selected ? styles.selected : ""}`} onClick={onClick}>
      <div className={styles.icon_symbol_container}>
        {/* <div className={styles.icon} /> */}
        <div className={styles.icon}>
          <Image src={`/tokenIcons/${symbol.toLowerCase()}.svg`} width="100%" height="100%" layout="intrinsic" />
        </div>
        <div>
          <div className={styles.token_name}>{name}</div>
          <div className={styles.token_symbol}>
            {symbol}
            {/* {address} */}
          </div>
        </div>
      </div>
      <div className={styles.value_container}>
        <div className={styles.balance}>{balance}</div>
        <div className={styles.usd_value}>${usdValue}</div>
      </div>
    </div>
  )
}

export default TokenListEntry

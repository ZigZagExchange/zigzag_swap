import Image from "next/image"
import { ZZTokenInfo } from "../../../contexts/ExchangeContext"
import DownArrow from "../../DownArrow"
import styles from "./TokenSelector.module.css"

interface Props {
  selectedToken: ZZTokenInfo | null
  openTokenSelectModal: () => void
}

export default function TokenSelector({ selectedToken, openTokenSelectModal }: Props) {
  const tokenIcon = selectedToken ? (
    <div className={styles.icon_container}>
      <Image src={`/tokenIcons/${selectedToken.symbol.toLowerCase()}.svg`} width="100%" height="100%" layout="intrinsic" />
    </div>
  ) : (
    <div className={styles.no_token_text}>Select token</div>
  )

  const tokenSymbol = selectedToken ? selectedToken.symbol : null

  const down_arrow = <DownArrow />
  return (
    <>
      <button className={`${styles.button} ${!selectedToken ? styles.no_token : ""}`} onClick={openTokenSelectModal}>
        {tokenIcon} <span className={styles.symbol}>{tokenSymbol}</span> {down_arrow}
      </button>
    </>
  )
}

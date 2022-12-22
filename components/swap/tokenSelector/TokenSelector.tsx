import Image from "next/image"
import DownArrow from "../../DownArrow"
import styles from "./TokenSelector.module.css"

interface Props {
  selectedTokenSymbol: string
  openTokenSelectModal: () => void
}

export default function TokenSelector({ selectedTokenSymbol, openTokenSelectModal }: Props) {
  const selected_token_icon = (
    <div className={styles.icon_container}>
      <Image src={`/tokenIcons/${selectedTokenSymbol.toLowerCase()}.svg`} width="100%" height="100%" layout="intrinsic" />
    </div>
  )

  const down_arrow = <DownArrow />
  return (
    <>
      <button className={styles.button} onClick={openTokenSelectModal}>
        {selected_token_icon} <span className={styles.symbol}>{selectedTokenSymbol}</span> {down_arrow}
      </button>
    </>
  )
}

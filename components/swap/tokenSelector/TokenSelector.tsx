import Image from "next/image"
import styles from "./TokenSelector.module.css"

interface Props {
  selectedTokenSymbol: string
  openModal: () => void
}

export default function TokenSelector({ selectedTokenSymbol, openModal }: Props) {
  const selected_token_icon = (
    <div className={styles.icon_container}>
      <Image src={`/tokenIcons/${selectedTokenSymbol}.svg`} width="100%" height="100%" layout="intrinsic" />
    </div>
  )
  const down_arrow = (
    <svg height="1.5em" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
    </svg>
  )
  return (
    <>
      <button className={styles.button} onClick={openModal}>
        {selected_token_icon} {selectedTokenSymbol} {down_arrow}
      </button>
    </>
  )
}

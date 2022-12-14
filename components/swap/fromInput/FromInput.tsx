import styles from "./FromInput.module.css"
import input_styles from "../Input.module.css"
import TokenSelector from "../tokenSelector/TokenSelector"

interface Props {
  sellTokenSymbol: string
  openModal: () => void
}

export default function FromInput({ sellTokenSymbol, openModal }: Props) {
  return (
    <div className={input_styles.container}>
      <TokenSelector selectedTokenSymbol={sellTokenSymbol} openModal={openModal} />
      <input className={input_styles.input} type="number" placeholder="0.00" />
    </div>
  )
}

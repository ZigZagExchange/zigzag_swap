import styles from "./ToInput.module.css"
import input_styles from "../Input.module.css"
import TokenSelector from "../tokenSelector/TokenSelector"

interface Props {
  buyTokenSymbol: string
  openModal: () => void
}

export default function ToInput({ buyTokenSymbol, openModal }: Props) {
  return (
    <div className={input_styles.container}>
      <TokenSelector selectedTokenSymbol={buyTokenSymbol} openModal={openModal} />
      <input className={input_styles.input} type="number" placeholder="0.00" />
    </div>
  )
}

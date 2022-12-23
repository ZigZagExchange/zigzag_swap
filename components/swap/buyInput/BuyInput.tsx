import { useContext } from "react"

import input_styles from "../Input.module.css"

import TokenSelector from "../tokenSelector/TokenSelector"
import { SwapContext } from "../../../contexts/SwapContext"
import { ExchangeContext } from "../../../contexts/ExchangeContext"
import { truncateDecimals } from "../../../utils/utils"

interface Props {
  openBuyTokenSelectModal: () => void
}

export default function BuyInput({ openBuyTokenSelectModal }: Props) {
  const { buyTokenInfo } = useContext(ExchangeContext)
  const { buyInput, setBuyInput, tokensChanged } = useContext(SwapContext)

  function safeSetBuyAmount(newAmount: string) {
    newAmount = newAmount.replace(",", ".")
    newAmount = truncateDecimals(newAmount, buyTokenInfo ? buyTokenInfo.decimals : 18)
    setBuyInput(newAmount)
  }

  return (
    <div className={input_styles.container}>
      <TokenSelector selectedToken={buyTokenInfo} openTokenSelectModal={openBuyTokenSelectModal} />
      <input
        className={input_styles.input}
        onInput={p => safeSetBuyAmount(p.currentTarget.value)}
        value={tokensChanged ? "" : buyInput}
        type="string"
        placeholder={"0"}
        onKeyDown={e => {
          // Prevent negative numbers and + symbols
          const is_not_valid_key = ["+", "-", "e"].includes(e.key)
          if (is_not_valid_key) {
            e.preventDefault()
          }
        }}
      />
    </div>
  )
}

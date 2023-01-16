import { useContext } from "react"

import { ethers, utils } from "ethers"

import input_styles from "../Input.module.css"
import TokenSelector from "../tokenSelector/TokenSelector"
import { SwapContext } from "../../../contexts/SwapContext"
import { ExchangeContext } from "../../../contexts/ExchangeContext"
import { truncateDecimals } from "../../../utils/utils"

interface Props {
  openSellTokenSelectModal: () => void
}

export default function SellInput({ openSellTokenSelectModal }: Props) {
  const { balances, sellTokenInfo } = useContext(ExchangeContext)
  const { sellInput, setSellInput, tokensChanged } = useContext(SwapContext)

  function safeSetSellAmount(newAmount: string) {
    newAmount = newAmount.replace(",", ".")
    newAmount = truncateDecimals(newAmount, sellTokenInfo ? sellTokenInfo.decimals : 18)
    setSellInput(newAmount)
  }

  function maximize() {
    if (!sellTokenInfo) return
    const balance = balances[sellTokenInfo.address]
    if (!sellTokenInfo || !balance) return
    let tokenBalance: string = utils.formatUnits(balance.value, sellTokenInfo.decimals)
    if (sellTokenInfo.address === ethers.constants.AddressZero) {
      tokenBalance = String(Number(tokenBalance) - 0.005)
    }
    setSellInput(tokenBalance)
  }

  return (
    <div className={input_styles.container}>
      <TokenSelector selectedToken={sellTokenInfo} openTokenSelectModal={openSellTokenSelectModal} />
      <button className={input_styles.max_button} onClick={maximize}>
        MAX
      </button>
      <input
        className={input_styles.input}
        onInput={p => safeSetSellAmount(p.currentTarget.value)}
        value={tokensChanged ? "" : sellInput}
        type="string"
        placeholder={"0"}
        onKeyDown={e => {
          // Prevent negative numbers and + symbols
          const is_not_valid_key = ["+", "-", "e", "=", "?", "/"].includes(e.key)
          if (is_not_valid_key) {
            e.preventDefault()
          }
        }}
      />
    </div>
  )
}

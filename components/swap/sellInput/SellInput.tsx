import React, { useState, useContext, useEffect } from "react"

import { ethers, utils } from "ethers"

import input_styles from "../Input.module.css"
import TokenSelector from "../tokenSelector/TokenSelector"
import { SwapContext } from "../../../contexts/SwapContext"
import { ZZTokenInfo } from "../../../contexts/ExchangeContext"
import { prettyBalance, truncateDecimals } from "../../../utils/utils"

import { ValidationState } from "../Swap"
import { WalletContext } from "../../../contexts/WalletContext"

interface Props {
  sellTokenInfo: ZZTokenInfo | null
  balance: ethers.BigNumber | null
  validationStateSell: ValidationState  
  openModal: () => void
}

export default function SellInput({ sellTokenInfo, balance, validationStateSell, openModal }: Props) {
  const { sellAmount, setSellAmount } = useContext(SwapContext)
  const { userAddress } = useContext(WalletContext)
  const [input, setInput] = useState<string>("")

  useEffect(() => {
    if (sellAmount === 0) {
      setInput("")
    } else {
      console.log("Setting sell input to " + prettyBalance(sellAmount))
      setInput(prettyBalance(sellAmount))
    }
  }, [sellAmount])


  function safeSetSellAmount(newAmount: string) {
    newAmount = newAmount.replace(",", ".")
    newAmount = truncateDecimals(newAmount, sellTokenInfo ? sellTokenInfo.decimals : 18)
    setInput(newAmount)
    setSellAmount(Number(newAmount))
  }

  function maximize() {
    if (!sellTokenInfo || !balance) return
    const balance_string = utils.formatUnits(balance, sellTokenInfo.decimals)
    safeSetSellAmount(prettyBalance(balance_string))
  }

  const sellTokenSymbol = sellTokenInfo?.symbol ? sellTokenInfo?.symbol : "Token"
  return (
    <div className={`${input_styles.container} ${userAddress && validationStateSell !== ValidationState.OK ? input_styles.error : ""}`}>
      <TokenSelector selectedTokenSymbol={sellTokenSymbol} openModal={openModal} />
      <button className={input_styles.max_button} onClick={maximize}>
        MAX
      </button>
      <input
        className={input_styles.input}
        onInput={p => safeSetSellAmount(p.currentTarget.value)}
        // onFocus={() => setIsFocused(true)}
        // onBlur={() => setIsFocused(false)}
        value={input}
        type="number"
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

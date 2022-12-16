import React, { useState, useContext, useEffect } from "react"

import { ethers } from "ethers"

import input_styles from "../Input.module.css"
import TokenSelector from "../tokenSelector/TokenSelector"
import { SwapContext } from "../../../contexts/SwapContext"
import { ZZTokenInfo } from "../../../contexts/ExchangeContext"
import { prettyBalance, truncateDecimals } from "../../../utils/utils"

import { ValidationState } from "../Swap"

interface Props {
  sellTokenInfo: ZZTokenInfo | null
  balance: ethers.BigNumber | null
  allowance: ethers.BigNumber | null
  validationStateSell: ValidationState
  setValidationStateSell: (state: ValidationState) => void
  openModal: () => void
}

export default function SellInput({ sellTokenInfo, balance, allowance, validationStateSell, openModal, setValidationStateSell }: Props) {
  const { sellAmount, setSellAmount, setBuyAmount } = useContext(SwapContext)
  const [input, setInput] = useState<string>("")

  useEffect(() => {
    console.log("Setting sell input to " + String(sellAmount))
    setInput(String(sellAmount))
  }, [sellAmount])

  function getValidationState(amount: string) {
    if (amount === "" || isNaN(Number(amount))) {
      return ValidationState.IsNaN
    }
    if (Number(amount) < 0) {
      return ValidationState.IsNegative
    }
    if (!sellTokenInfo) {
      return ValidationState.InternalError
    }
    const amountBN = ethers.utils.parseUnits(amount, sellTokenInfo.decimals)
    if (balance !== null && amountBN.gt(balance)) {
      return ValidationState.InsufficientBalance
    }
    if (allowance !== null && amountBN.gt(allowance)) {
      return ValidationState.ExceedsAllowance
    }
    return ValidationState.OK
  }

  function safeSetSellAmount(newAmount: string) {
    // newAmount = newAmount.replace(",", ".")
    // newAmount = truncateDecimals(newAmount, 10)
    setInput(newAmount)
    // if (!newAmount || newAmount === "" || newAmount === "0.0") {
    //   setValidationStateSell(ValidationState.OK)
    //   setSellAmount(0)
    // }

    const validation = newAmount === "" ? ValidationState.OK : getValidationState(newAmount)
    setValidationStateSell(validation)

    if (validation === ValidationState.OK || validation === ValidationState.ExceedsAllowance || validation === ValidationState.InsufficientBalance)
      setSellAmount(Number(newAmount))
  }

  // if (!isFocused && sellAmount !== Number(input)) setInput(prettyBalance(sellAmount))
  const sellTokenSymbol = sellTokenInfo?.symbol ? sellTokenInfo?.symbol : "Token"

  return (
    <div className={`${input_styles.container} ${validationStateSell !== ValidationState.OK ? input_styles.error : ""}`}>
      <TokenSelector selectedTokenSymbol={sellTokenSymbol} openModal={openModal} />
      <input
        className={input_styles.input}
        // onInput={p => safeSetSellAmount(p.currentTarget.value)}
        onInput={p => safeSetSellAmount(p.currentTarget.value)}
        // onFocus={() => setIsFocused(true)}
        // onBlur={() => setIsFocused(false)}
        // value={isFocused ? input : prettyBalance(sellAmount)}
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

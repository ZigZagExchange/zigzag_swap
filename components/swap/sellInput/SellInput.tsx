import React, { useState, useContext, useEffect } from "react"

import input_styles from "../Input.module.css"
import TokenSelector from "../tokenSelector/TokenSelector"
import { ethers } from "ethers"

import { SwapContext } from "../../../contexts/SwapContext"
import { ZZTokenInfo } from "../../../contexts/ExchangeContext"
import { prettyBalance, truncateDecimals } from "../../../utils/utils"

interface Props {
  sellTokenInfo: ZZTokenInfo | null
  balance: ethers.BigNumber | null
  allowance: ethers.BigNumber | null
  openModal: () => void
}

enum ValidationState {
  OK,
  IsNaN,
  IsNegative,
  InsufficientBalance,
  ExceedsAllowance,
  InternalError
}

export default function SellInput({ sellTokenInfo, balance, allowance, openModal }: Props) {
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [input, setInput] = useState<string>("")
  const [validationState, setValidationState] = useState<ValidationState>(ValidationState.OK)

  const { sellAmount, setSellAmount } = useContext(SwapContext)

  function getValidatioState(amount: string) {
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
    newAmount = newAmount.replace(',', '.')
    newAmount = truncateDecimals(newAmount, 10)
    setInput(newAmount)
    if (newAmount === "" || newAmount === "0.0") {
      setValidationState(ValidationState.OK)
      setSellAmount(0)
    }

    const validation = getValidatioState(newAmount)
    setValidationState(validation)
    setSellAmount(Number(newAmount))    
  }

  if (!isFocused && sellAmount !== Number(input)) setInput(prettyBalance(sellAmount))
  const sellTokenSymbol = sellTokenInfo?.symbol ? sellTokenInfo?.symbol : "Token"
  return (
    <div className={input_styles.container}>
      <TokenSelector selectedTokenSymbol={sellTokenSymbol} openModal={openModal} />
      <input 
        className={validationState === ValidationState.OK ? input_styles.input : input_styles.input_with_error }
        onInput={p => safeSetSellAmount(p.currentTarget.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        value={isFocused ? input : prettyBalance(sellAmount)}
        type="string"
        placeholder={"0.00"}
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

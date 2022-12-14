import React, { useState, useContext } from "react"
import { ethers } from "ethers"

import input_styles from "../Input.module.css"

import TokenSelector from "../tokenSelector/TokenSelector"
import { SwapContext } from "../../../contexts/SwapContext"
import { ZZTokenInfo } from "../../../contexts/ExchangeContext"
import { prettyBalance, truncateDecimals } from "../../../utils/utils"
import { ValidationState } from "../Swap"

interface Props {
  buyTokenInfo: ZZTokenInfo | null
  validationStateBuy: ValidationState
  openModal: () => void
  setValidationStateBuy: (state: ValidationState) => void
}

export default function BuyInput({ 
  buyTokenInfo,
  validationStateBuy,
  openModal,
  setValidationStateBuy
}: Props) {
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [input, setInput] = useState<string>("")

  const { buyAmount, setBuyAmount } = useContext(SwapContext)

  function getValidatioState(amount: string) {
    if (amount === "" || isNaN(Number(amount))) {
      return ValidationState.IsNaN
    }
    if (Number(amount) < 0) {
      return ValidationState.IsNegative
    }
    if (!buyTokenInfo) {
      return ValidationState.InternalError
    }
    return ValidationState.OK
  }

  function safeSetBuyAmount(newAmount: string) {
    newAmount = newAmount.replace(',', '.')
    newAmount = truncateDecimals(newAmount, 10)
    setInput(newAmount)
    if (newAmount === "" || newAmount === "0.0") {
      setValidationStateBuy(ValidationState.OK)
      setBuyAmount(0)
    }

    const validation = getValidatioState(newAmount)
    setValidationStateBuy(validation)
    setBuyAmount(Number(newAmount))
  }

  if (!isFocused && buyAmount !== Number(input)) setInput(prettyBalance(buyAmount))
  const buyTokenSymbol = buyTokenInfo?.symbol ? buyTokenInfo?.symbol : "Token"
  return (
    <div className={input_styles.container}>
      <TokenSelector selectedTokenSymbol={buyTokenSymbol} openModal={openModal} />
      <input
        className={validationStateBuy === ValidationState.OK ? input_styles.input : input_styles.input_with_error}
        onInput={p => safeSetBuyAmount(p.currentTarget.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        value={isFocused ? input : prettyBalance(buyAmount)}
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

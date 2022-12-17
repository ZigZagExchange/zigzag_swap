import React, { useState, useContext, useEffect } from "react"
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

export default function BuyInput({ buyTokenInfo, validationStateBuy, openModal, setValidationStateBuy }: Props) {
  const { buyAmount, setBuyAmount } = useContext(SwapContext)

  // const [isFocused, setIsFocused] = useState<boolean>(false)
  const [input, setInput] = useState<string>("")

  function getValidationState(amount: string) {
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

  useEffect(() => {
    if (buyAmount === 0) {
      setInput("")
    } else {
      console.log("Setting buy input to " + prettyBalance(buyAmount))
      setInput(prettyBalance(buyAmount))
    }
  }, [buyAmount])

  function safeSetBuyAmount(newAmount: string) {
    newAmount = newAmount.replace(",", ".")
    newAmount = truncateDecimals(newAmount, buyTokenInfo ? buyTokenInfo.decimals : 18)
    setInput(newAmount)
    // if (newAmount === "" || newAmount === "0.0") {
    //   setValidationStateBuy(ValidationState.OK)
    //   setBuyAmount(0)
    // }

    const validation = newAmount === "" ? ValidationState.OK : getValidationState(newAmount)
    setValidationStateBuy(validation)

    if (newAmount === "0" || validation === ValidationState.OK) setBuyAmount(Number(newAmount))
  }

  // if (!isFocused && buyAmount !== Number(input)) setInput(prettyBalance(buyAmount))
  const buyTokenSymbol = buyTokenInfo?.symbol ? buyTokenInfo?.symbol : "Token"

  return (
    <div className={`${input_styles.container} ${validationStateBuy !== ValidationState.OK ? input_styles.error : ""}`}>
      <TokenSelector selectedTokenSymbol={buyTokenSymbol} openModal={openModal} />
      <input
        className={input_styles.input}
        onInput={p => safeSetBuyAmount(p.currentTarget.value)}
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

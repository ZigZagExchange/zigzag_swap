import React, { useState, useContext, useEffect } from "react"
import { ethers } from "ethers"

import input_styles from "../Input.module.css"

import TokenSelector from "../tokenSelector/TokenSelector"
import { SwapContext } from "../../../contexts/SwapContext"
import { ExchangeContext, ZZTokenInfo } from "../../../contexts/ExchangeContext"
import { truncateDecimals } from "../../../utils/utils"
import { ValidationState } from "../Swap"

interface Props {
  validationStateBuy: ValidationState
  openBuyTokenSelectModal: () => void
}

export default function BuyInput({ validationStateBuy, openBuyTokenSelectModal }: Props) {
  const { buyTokenInfo } = useContext(ExchangeContext)
  const { buyInput, setBuyInput } = useContext(SwapContext)

  function safeSetBuyAmount(newAmount: string) {
    newAmount = newAmount.replace(",", ".")
    newAmount = truncateDecimals(newAmount, buyTokenInfo ? buyTokenInfo.decimals : 18)
    setBuyInput(newAmount)
  }

  return (
    <div className={`${input_styles.container} ${validationStateBuy !== ValidationState.OK ? input_styles.error : ""}`}>
      <TokenSelector selectedTokenSymbol={buyTokenInfo.symbol} openTokenSelectModal={openBuyTokenSelectModal} />
      <input
        className={input_styles.input}
        onInput={p => safeSetBuyAmount(p.currentTarget.value)}
        // onFocus={() => setIsFocused(true)}
        // onBlur={() => setIsFocused(false)}
        value={buyInput}
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

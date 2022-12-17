import React, { useState, useContext, useEffect } from "react"
import { ethers } from "ethers"

import input_styles from "../Input.module.css"

import TokenSelector from "../tokenSelector/TokenSelector"
import { SwapContext } from "../../../contexts/SwapContext"
import { ZZTokenInfo } from "../../../contexts/ExchangeContext"
import { truncateDecimals } from "../../../utils/utils"
import { ValidationState } from "../Swap"

interface Props {
  buyTokenInfo: ZZTokenInfo | null
  validationStateBuy: ValidationState
  openModal: () => void
}

export default function BuyInput({ buyTokenInfo, validationStateBuy, openModal }: Props) {
  const { buyInput, setBuyInput } = useContext(SwapContext)

  function safeSetBuyAmount(newAmount: string) {
    newAmount = newAmount.replace(",", ".")
    newAmount = truncateDecimals(newAmount, buyTokenInfo ? buyTokenInfo.decimals : 18)
    setBuyInput(newAmount)
  }

  const buyTokenSymbol = buyTokenInfo?.symbol ? buyTokenInfo?.symbol : "Token"
  return (
    <div className={`${input_styles.container} ${validationStateBuy !== ValidationState.OK ? input_styles.error : ""}`}>
      <TokenSelector selectedTokenSymbol={buyTokenSymbol} openModal={openModal} />
      <input
        className={input_styles.input}
        onInput={p => safeSetBuyAmount(p.currentTarget.value)}
        // onFocus={() => setIsFocused(true)}
        // onBlur={() => setIsFocused(false)}
        value={buyInput === "0.0" ? "" : buyInput}
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

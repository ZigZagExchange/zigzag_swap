import React, { useState, useContext, useEffect } from "react"

import { ethers, utils } from "ethers"

import input_styles from "../Input.module.css"
import TokenSelector from "../tokenSelector/TokenSelector"
import { SwapContext } from "../../../contexts/SwapContext"
import { ZZTokenInfo } from "../../../contexts/ExchangeContext"
import { balanceCommas, truncateDecimals } from "../../../utils/utils"

import { ValidationState } from "../Swap"
import { WalletContext } from "../../../contexts/WalletContext"

interface Props {
  sellTokenInfo: ZZTokenInfo | null
  balance: ethers.BigNumber | null
  validationStateSell: ValidationState
  openSellTokenSelectModal: () => void
}

export default function SellInput({ sellTokenInfo, balance, validationStateSell, openSellTokenSelectModal }: Props) {
  const { sellInput, setSellInput } = useContext(SwapContext)
  const { userAddress } = useContext(WalletContext)

  function safeSetSellAmount(newAmount: string) {
    newAmount = newAmount.replace(",", ".")
    newAmount = truncateDecimals(newAmount, sellTokenInfo ? sellTokenInfo.decimals : 18)
    setSellInput(newAmount)
  }

  function maximize() {
    if (!sellTokenInfo || !balance) return
    let tokenBalance: string = utils.formatUnits(balance, sellTokenInfo.decimals)
    if (sellTokenInfo.address === ethers.constants.AddressZero) {
      tokenBalance = String(Number(tokenBalance) - 0.005)
    }
    setSellInput(tokenBalance)
  }

  const sellTokenSymbol = sellTokenInfo?.symbol ? sellTokenInfo?.symbol : "Token"
  return (
    <div className={`${input_styles.container} ${userAddress && validationStateSell !== ValidationState.OK ? input_styles.error : ""}`}>
      <TokenSelector selectedTokenSymbol={sellTokenSymbol} openTokenSelectModal={openSellTokenSelectModal} />
      <button className={input_styles.max_button} onClick={maximize}>
        MAX
      </button>
      <input
        className={input_styles.input}
        onInput={p => safeSetSellAmount(p.currentTarget.value)}
        // onFocus={() => setIsFocused(true)}
        // onBlur={() => setIsFocused(false)}
        value={sellInput}
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

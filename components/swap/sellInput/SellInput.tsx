import React, { useState, useContext, useEffect } from "react"

import { ethers, utils } from "ethers"

import input_styles from "../Input.module.css"
import TokenSelector from "../tokenSelector/TokenSelector"
import { SwapContext } from "../../../contexts/SwapContext"
import { ExchangeContext, ZZTokenInfo } from "../../../contexts/ExchangeContext"
import { balanceCommas, truncateDecimals } from "../../../utils/utils"

import { SellValidationState } from "../Swap"
import { WalletContext } from "../../../contexts/WalletContext"

interface Props {
  validationStateSell: SellValidationState
  openSellTokenSelectModal: () => void
}

export default function SellInput({ validationStateSell, openSellTokenSelectModal }: Props) {
  const { balances, sellTokenInfo } = useContext(ExchangeContext)
  const { sellInput, setSellInput } = useContext(SwapContext)
  const { userAddress } = useContext(WalletContext)

  function safeSetSellAmount(newAmount: string) {
    newAmount = newAmount.replace(",", ".")
    newAmount = truncateDecimals(newAmount, sellTokenInfo ? sellTokenInfo.decimals : 18)
    setSellInput(newAmount)
  }

  function maximize() {
    const balance = balances[sellTokenInfo.address]
    if (!sellTokenInfo || !balance) return
    let tokenBalance: string = utils.formatUnits(balance.value, sellTokenInfo.decimals)
    if (sellTokenInfo.address === ethers.constants.AddressZero) {
      tokenBalance = String(Number(tokenBalance) - 0.005)
    }
    setSellInput(tokenBalance)
  }

  const sellTokenSymbol = sellTokenInfo?.symbol ? sellTokenInfo?.symbol : "Token"
  return (
    <div
      className={input_styles.container}
      // className={`${input_styles.container} ${userAddress && validationStateSell !== SellValidationState.OK ? input_styles.error : ""}`}
    >
      <TokenSelector selectedTokenSymbol={sellTokenSymbol} openTokenSelectModal={openSellTokenSelectModal} />
      <button className={input_styles.max_button} onClick={maximize}>
        MAX
      </button>
      <input
        className={input_styles.input}
        onInput={p => safeSetSellAmount(p.currentTarget.value)}
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

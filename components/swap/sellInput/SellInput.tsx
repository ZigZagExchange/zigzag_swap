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
  allowance: ethers.BigNumber | null
  validationStateSell: ValidationState
  setValidationStateSell: (state: ValidationState) => void
  openModal: () => void
}

export default function SellInput({ sellTokenInfo, balance, allowance, validationStateSell, openModal, setValidationStateSell }: Props) {
  const { sellAmount, swapPrice, setSellAmount } = useContext(SwapContext)
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

  useEffect(() => {
    if (!swapPrice) getValidationState(String(sellAmount))
  }, [swapPrice])

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
    if (!swapPrice) {
      return ValidationState.MissingLiquidity
    }
    const amountBN = ethers.utils.parseUnits(amount, sellTokenInfo.decimals)
    if (balance !== null && amountBN.gt(balance)) {
      return ValidationState.InsufficientBalance
    }
    if (allowance !== null && allowance !== undefined && amountBN.gt(allowance)) {
      return ValidationState.ExceedsAllowance
    }
    return ValidationState.OK
  }

  function safeSetSellAmount(newAmount: string) {
    newAmount = newAmount.replace(",", ".")
    newAmount = truncateDecimals(newAmount, sellTokenInfo ? sellTokenInfo.decimals : 18)
    setInput(newAmount)
    // if (!newAmount || newAmount === "" || newAmount === "0.0") {
    //   setValidationStateSell(ValidationState.OK)
    //   setSellAmount(0)
    // }

    const validation = newAmount === "" ? ValidationState.OK : getValidationState(newAmount)
    setValidationStateSell(validation)

    if (
      newAmount === "0" ||
      validation === ValidationState.OK ||
      validation === ValidationState.ExceedsAllowance ||
      validation === ValidationState.InsufficientBalance
    ) {
      setSellAmount(Number(newAmount))
    }
  }

  function maximize() {
    if (!sellTokenInfo || !balance) return
    const balance_string = utils.formatUnits(balance, sellTokenInfo.decimals)
    setInput(prettyBalance(balance_string))
    setSellAmount(Number(balance_string))
  }

  // if (!isFocused && sellAmount !== Number(input)) setInput(prettyBalance(sellAmount))
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

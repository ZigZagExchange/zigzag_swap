import React, { useContext, useMemo, useState } from "react"
import { ethers } from "ethers"

import erc20Abi from "../../../data/abis/erc20.json"
import exchangeAbi from "../../../data/abis/exchange.json"

import { WalletContext } from "../../../contexts/WalletContext"
import { ExchangeContext } from "../../../contexts/ExchangeContext"
import { SwapContext } from "../../../contexts/SwapContext"

import { ValidationState } from "../Swap"

import styles from "./SwapButton.module.css"

interface Props {
  validationStateBuy: ValidationState
  validationStateSell: ValidationState
}

export default function SwapButton({ validationStateBuy, validationStateSell }: Props) {
  const [enabled, setEnabled] = useState<boolean>(false)
  const [enableApprove, setEnableApprove] = useState<boolean>(false)

  const { signer } = useContext(WalletContext)
  const { balances, sellTokenInfo, buyTokenInfo, exchangeAddress } = useContext(ExchangeContext)
  const { swapPrice, sellAmount, quoteOrder } = useContext(SwapContext)

  const exchangeContract: ethers.Contract | null = useMemo(() => {
    if (exchangeAddress && signer) {
      return new ethers.Contract(exchangeAddress, exchangeAbi, signer)
    }
    return null
  }, [exchangeAddress, signer])

  const tokenContract: ethers.Contract | null = useMemo(() => {
    if (sellTokenInfo && signer) {
      return new ethers.Contract(sellTokenInfo.address, erc20Abi, signer)
    }
    return null
  }, [sellTokenInfo, signer])

  const buttonText: string = useMemo(() => {
    if (!buyTokenInfo || !sellTokenInfo) {
      setEnableApprove(false)
      setEnabled(false)
      return "Error"
    }

    if (validationStateSell === ValidationState.InsufficientBalance) {
      setEnableApprove(false)
      setEnabled(false)
      return `Sell amount exceeds ${sellTokenInfo.symbol} balance`
    }

    if (validationStateSell === ValidationState.ExceedsAllowance) {
      setEnableApprove(true)
      setEnabled(true)
      return `Approve ${sellTokenInfo.symbol}`
    }

    if (validationStateSell !== ValidationState.OK) {
      setEnableApprove(false)
      setEnabled(false)
      return "Error on the sell side"
    } else if (validationStateBuy !== ValidationState.OK) {
      setEnableApprove(false)
      setEnabled(false)
      return "Error on the buy side"
    } else {
      setEnableApprove(false)
      setEnabled(true)
      return "Swap"
    }
  }, [validationStateBuy, validationStateSell, buyTokenInfo, sellTokenInfo])

  async function sendSwap() {
    if (enableApprove || !enabled) return
    console.log("starting sendSwap")

    if (!exchangeContract) {
      console.warn("sendSwap: missing exchangeContract")
      return
    }

    if (!quoteOrder) {
      console.warn("sendSwap: missing quoteOrder")
      return
    }

    const remainingTime = Number(quoteOrder.order.expirationTimeSeconds) - Date.now() / 1000 
    if (remainingTime < 0) {
      console.warn("sendSwap: quote is expierd")
      return
    }
    if (remainingTime < 5) {
      console.warn(`sendSwap: only ${remainingTime} seconds remaining`)
    } else {
      console.log(`sendSwap: ${remainingTime} seconds remaining`)
    }

    if (!sellAmount || !sellTokenInfo || !buyTokenInfo) {
      console.warn("sendSwap: missing sellAmount, sellTokenInfo or buyTokenInfo")
      return
    }
    const sellBalanceParsed = balances[sellTokenInfo.address]?.value

    if (!sellBalanceParsed) {
      console.warn("sendSwap: missing balances for sell token")
      return
    }

    let sellAmountParsed: ethers.BigNumber = ethers.utils.parseUnits(sellAmount.toFixed(sellTokenInfo.decimals), sellTokenInfo.decimals)

    if (sellAmountParsed.gt(quoteOrder.order.buyAmount)) {
      console.warn("sendSwap: sell amount exceeds quote buy amount")
      return
    }

    const delta = sellAmountParsed.mul("100000").div(sellBalanceParsed).toNumber()
    if (delta > 99990) {
      // prevent dust issues
      // 99.9 %
      sellAmountParsed = sellBalanceParsed
    }

    const buyAmountParsed = sellAmountParsed.mul(quoteOrder.order.sellAmount).div(quoteOrder.order.buyAmount)
    const tx = await exchangeContract.fillOrder(
      [
        quoteOrder.order.user,
        quoteOrder.order.sellToken,
        quoteOrder.order.buyToken,
        quoteOrder.order.sellAmount,
        quoteOrder.order.buyAmount,
        quoteOrder.order.expirationTimeSeconds,
      ],
      quoteOrder.signature,
      buyAmountParsed.toString(),
      false
    )
    console.log("sendSwap: swap submitted: ", tx)
    await tx.wait()
    console.log("sendSwap: tx processed")
  }

  async function sendApprove() {
    if (!enableApprove || !enabled) return
    console.log("starting sendApprove")

    if (!exchangeAddress) {
      console.warn("sendApprove: missing exchange address")
      return
    }

    if (!tokenContract) {
      console.warn("sendApprove: missing tokenContract")
      return
    }

    const tx = await tokenContract.approve(exchangeAddress, ethers.constants.MaxUint256)
    console.log("sendApprove: approve submitted: ", tx)
    await tx.wait()
    console.log("sendApprove: tx processed")
  }

  return (
    <button className={styles.container} onClick={enableApprove ? sendApprove : sendSwap}>
      {buttonText}
    </button>
  )
}

import React, { useContext, useMemo, useState } from "react"
import { ethers } from "ethers"

import erc20Abi from "../../../data/abis/erc20.json"
import exchangeAbi from "../../../data/abis/exchange.json"

import { WalletContext } from "../../../contexts/WalletContext"
import { ExchangeContext } from "../../../contexts/ExchangeContext"
import { SwapContext } from "../../../contexts/SwapContext"

import { ValidationState } from "../Swap"

import styles from "./SwapButton.module.css"
import { truncateDecimals } from "../../../utils/utils"

enum SwapMode {
  Disabled,
  Swap,
  Approve,
  Deposit,
  Withdraw,
}

interface Props {
  validationStateBuy: ValidationState
  validationStateSell: ValidationState
  openSwapModal: () => void
  openApproveModal: () => void
  openWrapModal: () => void
  openUnwrapModal: () => void
  closeModal: () => void
}

export default function SwapButton({
  validationStateBuy,
  validationStateSell,
  openSwapModal,
  openApproveModal,
  openWrapModal,
  openUnwrapModal,
  closeModal,
}: Props) {
  const { balances, sellTokenInfo, buyTokenInfo, exchangeAddress, takerFee, makerFee, updateAllowances, updateBalances } = useContext(ExchangeContext)
  const { network, signer, userAddress } = useContext(WalletContext)
  const { sellAmount, quoteOrder, setTransactionStatus, setTransactionError, setIsFrozen } = useContext(SwapContext)

  const [swapMode, setSwapMode] = useState<SwapMode>(SwapMode.Disabled)

  const exchangeContract: ethers.Contract | null = useMemo(() => {
    if (exchangeAddress && signer) {
      return new ethers.Contract(exchangeAddress, exchangeAbi, signer)
    }
    return null
  }, [exchangeAddress, signer])

  const wethContract: ethers.Contract | null = useMemo(() => {
    if (network && network.wethContractAddress && signer) {
      return new ethers.Contract(
        network.wethContractAddress,
        [
          { constant: false, inputs: [], name: "deposit", outputs: [], payable: true, stateMutability: "payable", type: "function" },
          {
            constant: false,
            inputs: [{ name: "wad", type: "uint256" }],
            name: "withdraw",
            outputs: [],
            payable: false,
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        signer
      )
    }
    return null
  }, [network, signer])

  const buttonText: string = useMemo(() => {
    if (!userAddress) return "Swap"

    if (!buyTokenInfo || !sellTokenInfo) {
      setSwapMode(SwapMode.Disabled)
      return "Error"
    }

    if (validationStateSell === ValidationState.InsufficientBalance) {
      setSwapMode(SwapMode.Disabled)
      return `Sell amount exceeds ${sellTokenInfo.symbol} balance`
    }

    if (validationStateSell === ValidationState.ExceedsAllowance) {
      setSwapMode(SwapMode.Approve)
      return `Approve ${sellTokenInfo.symbol}`
    }

    if (validationStateSell !== ValidationState.OK) {
      setSwapMode(SwapMode.Disabled)
      return "Error on the sell side"
    }
    if (validationStateBuy !== ValidationState.OK) {
      setSwapMode(SwapMode.Disabled)
      return "Error on the buy side"
    }

    if (buyTokenInfo.address === network?.wethContractAddress && sellTokenInfo.address === ethers.constants.AddressZero) {
      setSwapMode(SwapMode.Deposit)
      return "Wrap ETH to WETH"
    }

    if (buyTokenInfo.address === ethers.constants.AddressZero && sellTokenInfo.address === network?.wethContractAddress) {
      setSwapMode(SwapMode.Withdraw)
      return "Unwrap WETH to ETH"
    }

    setSwapMode(SwapMode.Swap)
    return "Swap"
  }, [validationStateBuy, validationStateSell, buyTokenInfo, sellTokenInfo, userAddress, network])

  function handleSwapButton() {
    switch (swapMode) {
      case SwapMode.Approve:
        sendApprove()
        break
      case SwapMode.Swap:
        sendSwap()
        break
      case SwapMode.Deposit:
        sendDeposit()
        break
      case SwapMode.Withdraw:
        sendWithdraw()
        break
      case SwapMode.Disabled:
        console.error("handleSwapButton: swap mode disabled")
        break
    }
  }

  async function sendSwap() {
    if (swapMode !== SwapMode.Swap) return
    console.log("starting sendSwap")

    if (!exchangeContract) {
      console.warn("sendSwap: missing exchangeContract")
      return
    }

    if (!quoteOrder) {
      console.warn("sendSwap: missing quoteOrder")
      return
    }
    try {
      setIsFrozen(true)

      const remainingTime = Number(quoteOrder.order.expirationTimeSeconds) - Date.now() / 1000
      if (remainingTime < 0) {
        console.warn("sendSwap: quote is expired")
        throw new Error("sendSwap: Quote is expired.")
      }
      if (remainingTime < 5) {
        console.warn(`sendSwap: only ${remainingTime} seconds remaining`)
      } else {
        console.log(`sendSwap: ${remainingTime} seconds remaining`)
      }

      if (!sellTokenInfo || !buyTokenInfo) {
        console.warn("sendSwap: missing sellTokenInfo or buyTokenInfo")
        throw new Error("sendSwap: missing sellTokenInfo or buyTokenInfo")
      }
      const sellBalanceParsed = balances[sellTokenInfo.address]?.value

      if (!sellBalanceParsed) {
        console.warn("sendSwap: missing balances for sell token")
        throw new Error("sendSwap: missing balances for sell token")
      }

      if (sellAmount.gt(sellBalanceParsed)) {
        console.warn("sendSwap: sell amount exceeds balances")
        throw new Error("sendSwap: sell amount exceeds balances")
      }

      if (sellAmount.gt(quoteOrder.order.buyAmount)) {
        console.warn("sendSwap: sell amount exceeds quote buy amount")
        throw new Error("sendSwap: sell amount exceeds quote buy amount")
      }

      let sellAmountForSwap: ethers.BigNumber
      const delta = sellAmount.mul("100000").div(sellBalanceParsed).toNumber()
      if (delta > 99990) {
        // prevent dust issues
        // 99.9 %
        sellAmountForSwap = sellBalanceParsed
      } else {
        sellAmountForSwap = sellAmount
      }

      const quoteSellAmount = ethers.BigNumber.from(quoteOrder.order.sellAmount)
      const quoteBuyAmount = ethers.BigNumber.from(quoteOrder.order.buyAmount)
      // const quoteSellAmountWithFee = quoteSellAmount.add(quoteSellAmount.mul(makerFee * 10000).div(10000))
      // const quoteBuyAmountWithFee = quoteBuyAmount.add(quoteBuyAmount.mul(takerFee * 10000).div(10000))
      // const buyAmountForSwap: ethers.BigNumber = sellAmountForSwap.mul(quoteSellAmountWithFee).div(quoteBuyAmountWithFee)
      const buyAmountForSwap: ethers.BigNumber = sellAmountForSwap.mul(quoteSellAmount).div(quoteBuyAmount)

      setTransactionStatus("awaitingWallet")
      openSwapModal()
      console.log({ ...quoteOrder.order, signature: quoteOrder.signature, buyAmountForSwap: buyAmountForSwap.toString() })
      const tx = await exchangeContract.fillOrder(
        [
          quoteOrder.order.user,
          quoteOrder.order.sellToken,
          quoteOrder.order.buyToken,
          quoteOrder.order.sellAmount,
          // "109933904566720371",
          quoteOrder.order.buyAmount,
          quoteOrder.order.expirationTimeSeconds,
        ],
        quoteOrder.signature,
        buyAmountForSwap.toString(),
        false
      )
      setTransactionStatus("processing")
      console.log("sendSwap: swap submitted: ", tx)
      await tx.wait()
      setTransactionStatus("processed")
      console.log("sendSwap: tx processed")

      updateBalances([buyTokenInfo.address, sellTokenInfo.address])
      setTimeout(updateBalances, 3000, [buyTokenInfo.address, sellTokenInfo.address])
      setTimeout(() => {
        closeModal()
        setTransactionStatus(null)
        setTransactionError(null)
        setIsFrozen(false)
      }, 3000)
    } catch (error: any) {
      setTransactionError(error)
      setTimeout(() => {
        closeModal()
        setTransactionStatus(null)
        setTransactionError(null)
        setIsFrozen(false)
      }, 3000)
    }
  }

  async function sendApprove() {
    if (swapMode !== SwapMode.Approve) return
    console.log("starting sendApprove")

    if (!exchangeAddress) {
      console.warn("sendApprove: missing exchangeAddress")
      return
    }

    if (!signer) {
      console.warn("sendApprove: missing signer")
      return
    }

    if (!sellTokenInfo) {
      console.warn("sendApprove: missing sellTokenInfo")
      return
    }

    try {
      setTransactionStatus("awaitingWallet")
      openApproveModal() // Tx waiting for wallet
      const tokenContract: ethers.Contract = new ethers.Contract(sellTokenInfo.address, erc20Abi, signer)
      const tx = await tokenContract.approve(exchangeAddress, ethers.constants.MaxUint256)
      console.log("sendApprove: approve submitted: ", tx)
      setTransactionStatus("processing") // Tx processing
      await tx.wait()
      setTransactionStatus("processed") // Tx processed

      console.log("sendApprove: tx processed")

      updateAllowances([sellTokenInfo.address])
      setTimeout(updateAllowances, 3000, [sellTokenInfo.address])
      setTimeout(() => {
        closeModal()
        setTransactionStatus(null)
      }, 5000)
    } catch (error: any) {
      console.log(error)
      console.log(error.message)

      setTransactionError(error)
      setTimeout(() => {
        closeModal()
        setTransactionStatus(null)
        setTransactionError(null)
      }, 5000)
    }
  }

  async function sendDeposit() {
    if (swapMode !== SwapMode.Deposit) return
    console.log("starting sendDeposit")

    if (!wethContract) {
      console.warn("sendDeposit: missing wethContract")
      return
    }

    const sellBalanceParsed = balances[sellTokenInfo.address]?.value

    if (!sellBalanceParsed) {
      console.warn("sendDeposit: missing balances for sell token")
      return
    }

    if (sellAmount.gt(sellBalanceParsed)) {
      console.warn("sendDeposit: sell amount exceeds balances")
      return
    }

    let transactionValue: ethers.BigNumber
    const delta = sellAmount.mul("100000").div(sellBalanceParsed).toNumber()
    if (delta > 99990) {
      // prevent dust issues
      // 99.9 %
      transactionValue = sellBalanceParsed
    } else {
      transactionValue = sellAmount
    }

    try {
      setTransactionStatus("awaitingWallet")
      openWrapModal() // Tx waiting for wallet

      const tx = await wethContract.deposit({ value: transactionValue })
      setTransactionStatus("processing")

      console.log("sendDeposit: deposit submitted: ", tx)
      await tx.wait()
      setTransactionStatus("processed")

      console.log("sendDeposit: tx processed")

      updateBalances([buyTokenInfo.address, sellTokenInfo.address])
      setTimeout(updateBalances, 3000, [buyTokenInfo.address, sellTokenInfo.address])

      setTimeout(() => {
        closeModal()
        setTransactionStatus(null)
      }, 3000)
    } catch (error) {
      console.log(error)
      setTransactionError(error)
      setTimeout(() => {
        closeModal()
        setTransactionStatus(null)
        setTransactionError(null)
      }, 3000)
    }
  }

  async function sendWithdraw() {
    if (swapMode !== SwapMode.Withdraw) return
    console.log("starting sendWithdraw")

    if (!wethContract) {
      console.warn("sendWithdraw: missing wethContract")
      return
    }

    const sellBalanceParsed = balances[sellTokenInfo.address]?.value

    if (!sellBalanceParsed) {
      console.warn("sendWithdraw: missing balances for sell token")
      return
    }

    if (sellAmount.gt(sellBalanceParsed)) {
      console.warn("sendWithdraw: sell amount exceeds balances")
      return
    }

    let transactionValue: ethers.BigNumber
    const delta = sellAmount.mul("100000").div(sellBalanceParsed).toNumber()
    if (delta > 99990) {
      // prevent dust issues
      // 99.9 %
      transactionValue = sellBalanceParsed
    } else {
      transactionValue = sellAmount
    }

    try {
      setTransactionStatus("awaitingWallet")
      openUnwrapModal() // Tx waiting for wallet
      const tx = await wethContract.withdraw(transactionValue)
      console.log("sendWithdraw: withdraw submitted: ", tx)
      setTransactionStatus("processing")
      await tx.wait()
      setTransactionStatus("processed")
      console.log("sendWithdraw: tx processed")

      updateBalances([buyTokenInfo.address, sellTokenInfo.address])
      setTimeout(updateBalances, 3000, [buyTokenInfo.address, sellTokenInfo.address])
      setTimeout(() => {
        closeModal()
        setTransactionStatus(null)
      }, 3000)
    } catch (error) {
      console.log(error)
      setTransactionError(error)
      setTimeout(() => {
        closeModal()
        setTransactionStatus(null)
        setTransactionError(null)
      }, 3000)
    }
  }

  return (
    <button
      className={styles.container}
      onClick={handleSwapButton}
      disabled={signer === null || swapMode === SwapMode.Disabled || sellAmount.eq(ethers.constants.Zero)}
    >
      {buttonText}
    </button>
  )
}

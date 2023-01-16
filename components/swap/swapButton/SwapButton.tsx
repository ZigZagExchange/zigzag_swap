import React, { useContext, useMemo, useState } from "react"
import { BigNumber, ethers } from "ethers"

import erc20Abi from "../../../data/abis/erc20.json"
import exchangeAbi from "../../../data/abis/ZigZagExchange.json"

import { WalletContext } from "../../../contexts/WalletContext"
import { ExchangeContext } from "../../../contexts/ExchangeContext"
import { SwapContext, ZZOrder } from "../../../contexts/SwapContext"

import { SellValidationState, BuyValidationState } from "../Swap"

import styles from "./SwapButton.module.css"

enum ButtonMode {
  Disabled,
  Swap,
  Approve,
  Wrap,
  Unwrap,
  Connect,
  WrongNetwork,
}

interface Props {
  validationStateSell: SellValidationState
  validationStateBuy: BuyValidationState
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
  const { balances, sellTokenInfo, buyTokenInfo, exchangeAddress, updateAllowances, updateBalances } = useContext(ExchangeContext)
  const { network, signer, userAddress, connect } = useContext(WalletContext)
  const { sellAmount, buyAmount, quoteOrderRoutingArray, userInputSide, setTransactionStatus, setTransactionError, setIsFrozen } = useContext(SwapContext)

  const [buttonMode, setButtonMode] = useState<ButtonMode>(ButtonMode.Disabled)

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

  async function sendFillOrder(sellAmount: BigNumber | null, buyAmount: BigNumber | null, isNativeTokenSwap: boolean, sendETH: boolean) {
    console.log(`Executing sendFillOrder for sellAmount: ${sellAmount}, buyAmount: ${buyAmount}, isNativeTokenSwap: ${isNativeTokenSwap}, sendETH: ${sendETH}`)
    if (!exchangeContract) {
      console.warn("sendFillOrder: missing exchangeContract")
      return
    }
    if (quoteOrderRoutingArray.length === 0) {
      console.warn("sendFillOrder: missing quoteOrder")
      return
    }
    console.log("Orders: ", quoteOrderRoutingArray)
    if (!sellAmount && !buyAmount) {
      console.warn("sendFillOrder: missing sellAmount and buyAmount")
      return
    }

    setTransactionStatus("awaitingWallet")
    openSwapModal()
    let tx: any
    if (quoteOrderRoutingArray.length === 1) {
      const quoteOrder: ZZOrder = quoteOrderRoutingArray[0]
      if (sellAmount) {
        if (isNativeTokenSwap) {
          if (sendETH) {
            console.log("execute swap - exactInput - ETH -> ERC20")
            tx = await exchangeContract.fillOrderExactInputETH([
                quoteOrder.order.user,
                quoteOrder.order.sellToken,
                quoteOrder.order.buyToken,
                quoteOrder.order.sellAmount,
                quoteOrder.order.buyAmount,
                quoteOrder.order.expirationTimeSeconds,
              ],
              quoteOrder.signature,
              sellAmount.toString(),
              false,
              { value: sellAmount.toString() }
            )
          } else {
            console.log("execute swap - exactInput - ERC20 -> ETH")
            tx = await exchangeContract.fillOrderExactInputETH([
                quoteOrder.order.user,
                quoteOrder.order.sellToken,
                quoteOrder.order.buyToken,
                quoteOrder.order.sellAmount,
                quoteOrder.order.buyAmount,
                quoteOrder.order.expirationTimeSeconds,
              ],
              quoteOrder.signature,
              sellAmount.toString(),
              false
            ) 
          } 
        } else {
          console.log("execute swap - exactInput - ERC20 -> ERC20")
          tx = await exchangeContract.fillOrderExactInput([
              quoteOrder.order.user,
              quoteOrder.order.sellToken,
              quoteOrder.order.buyToken,
              quoteOrder.order.sellAmount,
              quoteOrder.order.buyAmount,
              quoteOrder.order.expirationTimeSeconds,
            ],
            quoteOrder.signature,
            sellAmount.toString(),
            false
          )
        }
      } else if (buyAmount) {
        if (isNativeTokenSwap) {
          if (sendETH) {
            console.log("execute swap - exactOutput - ETH -> ERC20")
            sellAmount = (buyAmount.mul(10000).div(10000-5)).mul(quoteOrder.order.buyAmount).div(quoteOrder.order.sellAmount)
            tx = await exchangeContract.fillOrderExactOutputETH([
                quoteOrder.order.user,
                quoteOrder.order.sellToken,
                quoteOrder.order.buyToken,
                quoteOrder.order.sellAmount,
                quoteOrder.order.buyAmount,
                quoteOrder.order.expirationTimeSeconds,
              ],
              quoteOrder.signature,
              buyAmount.toString(),
              false
              ,
              { value: sellAmount.toString() }
            )
          } else {
            console.log("execute swap - exactOutput - ERC20 -> ETH")
            tx = await exchangeContract.fillOrderExactOutputETH([
                quoteOrder.order.user,
                quoteOrder.order.sellToken,
                quoteOrder.order.buyToken,
                quoteOrder.order.sellAmount,
                quoteOrder.order.buyAmount,
                quoteOrder.order.expirationTimeSeconds,
              ],
              quoteOrder.signature,
              buyAmount.toString(),
              false
            )
          }        
        } else {
          console.log("execute swap - exactOutput - ERC20 -> ERC20")
          tx = await exchangeContract.fillOrderExactOutput([
              quoteOrder.order.user,
              quoteOrder.order.sellToken,
              quoteOrder.order.buyToken,
              quoteOrder.order.sellAmount,
              quoteOrder.order.buyAmount,
              quoteOrder.order.expirationTimeSeconds,
            ],
            quoteOrder.signature,
            buyAmount.toString(),
            false
          )
        }
      }
    } else {
      // quoteOrderRoutingArray.length > 1
      if (!sellAmount) {
        console.warn("sendFillOrder: missing sellAmount for route call")
        return
      }

      const quoteOrderCalldataArray = quoteOrderRoutingArray.map((quoteOrder: ZZOrder) => {
        return [
          quoteOrder.order.user,
          quoteOrder.order.sellToken,
          quoteOrder.order.buyToken,
          quoteOrder.order.sellAmount,
          quoteOrder.order.buyAmount,
          quoteOrder.order.expirationTimeSeconds
        ]
      })
      const signatureCalldataArray = quoteOrderRoutingArray.map((quoteOrder: ZZOrder) => quoteOrder.signature )

      if (isNativeTokenSwap) {
        if (sendETH) {
          console.log("execute swap - route - ETH -> ERC20")
          tx = await exchangeContract.fillOrderRouteETH(
            Object.values(quoteOrderCalldataArray),
            Object.values(signatureCalldataArray),
            sellAmount.toString(),
            false,
            { value: sellAmount.toString() }
          )
        } else {
          console.log("execute swap - route - ERC20 -> ETH")
          tx = await exchangeContract.fillOrderRouteETH(
            Object.values(quoteOrderCalldataArray),
            Object.values(signatureCalldataArray),
            sellAmount.toString(),
            false
          )
        }
      } else {
        console.log("execute swap - route - ERC20 -> ERC20")
        tx = await exchangeContract.fillOrderRoute(
          Object.values(quoteOrderCalldataArray),
          Object.values(signatureCalldataArray),
          sellAmount.toString(),
          false
        )
      }
    }

    setTransactionStatus("processing")
    console.log("sendSwap: swap submitted: ", tx)
    await tx.wait()
    setTransactionStatus("processed")
    console.log("sendSwap: tx processed")
  }

  function handleSwapButton() {
    switch (buttonMode) {
      case ButtonMode.Connect:
        connect()
        break
      case ButtonMode.Approve:
        sendApprove()
        break
      case ButtonMode.Swap:
        sendSwap()
        break
      case ButtonMode.Wrap:
        sendWrap()
        break
      case ButtonMode.Unwrap:
        sendUnwrap()
        break
      case ButtonMode.Disabled:
        console.error("handleSwapButton: swap mode disabled")
        break
    }
  }

  async function sendSwap() {
    if (buttonMode !== ButtonMode.Swap) return
    console.log("starting sendSwap")
    if (quoteOrderRoutingArray.length === 0) {
      console.warn("sendSwap: missing quoteOrder")
      return
    }

    try {
      setIsFrozen(true)

      let minCountdown: number = Number.MAX_SAFE_INTEGER
      quoteOrderRoutingArray.forEach((quoteOrder: ZZOrder) => {
        if (Number(quoteOrder.order.expirationTimeSeconds) < minCountdown) {
          minCountdown = Number(quoteOrder.order.expirationTimeSeconds)
        }
      })
      const remainingTime = minCountdown - Date.now() / 1000
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
      console.log("quoteOrderRoutingArray", quoteOrderRoutingArray)
      const firstQuoteOrder: ZZOrder | undefined = quoteOrderRoutingArray[0]
      const lastQuoteOrder: ZZOrder | undefined = quoteOrderRoutingArray.at(-1)

      if (!firstQuoteOrder || !lastQuoteOrder) {
        console.warn("sendSwap: missing quoteOrder")
        return
      }

      if (sellAmount.gt(firstQuoteOrder.order.buyAmount)) {
        console.warn("sendSwap: sell amount exceeds quote buy amount")
        throw new Error("sendSwap: sell amount exceeds quote buy amount")
      }

      let isNativeTokenSwap = false
      if (buyTokenInfo.address === ethers.constants.AddressZero) {
        if (lastQuoteOrder.order.sellToken !== wethContract?.address) {
          console.warn("sendSwap: native buy  with no matching weth order")
          throw new Error("sendSwap: native buy with no matching weth order")
        }
        isNativeTokenSwap = true
      } else if (sellTokenInfo.address === ethers.constants.AddressZero) {
        if (firstQuoteOrder.order.buyToken !== wethContract?.address) {
          console.warn("sendSwap: native sell with no matching weth order")
          throw new Error("sendSwap: native sell with no matching weth order")
        }
        isNativeTokenSwap = true
      }

      const sendETH = isNativeTokenSwap && sellTokenInfo.address === ethers.constants.AddressZero
      
      if (userInputSide === "sell" || quoteOrderRoutingArray.length > 1) {
        let sellAmountForSwap: ethers.BigNumber
        const delta = sellAmount.mul("100000").div(sellBalanceParsed).toNumber()
        if (delta > 99990) {
          // prevent dust issues
          // 99.9 %
          sellAmountForSwap = sellBalanceParsed
        } else {
          sellAmountForSwap = sellAmount
        }

        await sendFillOrder(sellAmountForSwap, null, isNativeTokenSwap, sendETH)
      } else {
        await sendFillOrder(null, buyAmount, isNativeTokenSwap, sendETH)
      }

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
    if (buttonMode !== ButtonMode.Approve) return
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
      setTimeout(updateAllowances, 6000, [sellTokenInfo.address])
      setTimeout(updateAllowances, 9000, [sellTokenInfo.address])
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

  async function sendWrap() {
    if (buttonMode !== ButtonMode.Wrap) return
    console.log("starting sendWrap")
    if (!buyTokenInfo) {
      console.warn("sendDeposit: missing buyTokenInfo")
      return
    }
    if (!sellTokenInfo) {
      console.warn("sendDeposit: missing sellTokenInfo")
      return
    }

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

  async function sendUnwrap() {
    if (buttonMode !== ButtonMode.Unwrap) return
    console.log("starting sendUnwrap")

    if (!wethContract) {
      console.warn("sendWithdraw: missing wethContract")
      return
    }

    if (!buyTokenInfo) {
      console.warn("sendWithdraw: missing buyTokenInfo")
      return
    }
    if (!sellTokenInfo) {
      console.warn("sendWithdraw: missing sellTokenInfo")
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

  const buttonText: JSX.Element = useMemo(() => {
    if (!userAddress) {
      setButtonMode(ButtonMode.Connect)
      return <div>Connect Wallet</div>
    }
    if (!network) {
      setButtonMode(ButtonMode.WrongNetwork)
      return <div>Wrong Network</div>
    }

    if (!sellTokenInfo) {
      setButtonMode(ButtonMode.Disabled)
      return <div>Select a token</div>
    }
    if (!buyTokenInfo) {
      setButtonMode(ButtonMode.Disabled)
      return <div>Select a token</div>
    }

    if (validationStateSell === SellValidationState.InsufficientBalance) {
      setButtonMode(ButtonMode.Disabled)
      return <div>Insufficient {sellTokenInfo.symbol} balance</div>
    }

    if (validationStateSell === SellValidationState.ExceedsAllowance) {
      setButtonMode(ButtonMode.Approve)
      return <div>Approve {sellTokenInfo.symbol}</div>
    }

    if (validationStateSell === SellValidationState.InternalError) {
      setButtonMode(ButtonMode.Disabled)
      return <div>Sell-side internal error</div>
    }

    if (validationStateSell === SellValidationState.IsNaN) {
      setButtonMode(ButtonMode.Disabled)
      return <div>Sell input is NaN</div>
    }

    if (validationStateSell === SellValidationState.IsNegative) {
      setButtonMode(ButtonMode.Disabled)
      return <div>Sell input is negative</div>
    }

    if (validationStateSell === SellValidationState.MissingLiquidity) {
      setButtonMode(ButtonMode.Disabled)
      return <div>Not enough liquidity</div>
    }

    if (validationStateBuy === BuyValidationState.InternalError) {
      setButtonMode(ButtonMode.Disabled)
      return <div>Buy-side internal error</div>
    }

    if (buyTokenInfo.address === network.wethContractAddress && sellTokenInfo.address === ethers.constants.AddressZero) {
      setButtonMode(ButtonMode.Wrap)
      return <div>Wrap ETH to WETH</div>
    }

    if (buyTokenInfo.address === ethers.constants.AddressZero && sellTokenInfo.address === network.wethContractAddress) {
      setButtonMode(ButtonMode.Unwrap)
      return <div>Unwrap WETH to ETH</div>
    }

    setButtonMode(ButtonMode.Swap)
    return <div>Swap</div>
  }, [validationStateBuy, validationStateSell, buyTokenInfo, sellTokenInfo, userAddress, network])

  const buttonDisabled =
    buttonMode === ButtonMode.Disabled || // Simply disabled
    buttonMode === ButtonMode.WrongNetwork || // Wrong network
    ((buttonMode === ButtonMode.Swap || buttonMode === ButtonMode.Wrap || buttonMode === ButtonMode.Unwrap) && sellAmount.eq(ethers.constants.Zero)) // Zero inputs

  const buttonError = buttonMode === ButtonMode.WrongNetwork || buttonMode === ButtonMode.Disabled

  return (
    <button className={`${styles.container} ${buttonError ? styles.error : ""}`} onClick={handleSwapButton} disabled={buttonDisabled}>
      {buttonText}
    </button>
  )
}

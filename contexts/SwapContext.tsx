import React, { useContext, createContext, useEffect, useState, useMemo } from "react"
import { ethers } from "ethers"

import exchangeAbi from "../data/abis/exchange.json"

import { WalletContext } from "./WalletContext"
import { ExchangeContext } from "./ExchangeContext"
import { getBigNumberFromInput, prettyBalance, truncateDecimals } from "../utils/utils"

interface Props {
  children: React.ReactNode
}

export type ZZOrder = {
  order: {
    user: string
    buyToken: string
    sellToken: string
    buyAmount: string
    sellAmount: string
    expirationTimeSeconds: string
  }
  signature: string
}

export type SwapContextType = {
  quoteOrder: ZZOrder | null
  swapPrice: number
  estimatedGasFee: number | undefined
  sellAmount: ethers.BigNumber
  buyAmount: ethers.BigNumber
  sellInput: string
  buyInput: string

  setSellInput: (amount: string) => void
  setBuyInput: (amount: string) => void

  switchTokens: () => void

  orderBook: ZZOrder[]

  transactionStatus: TransactionStatus
  setTransactionStatus: React.Dispatch<React.SetStateAction<TransactionStatus>>

  transactionError: any | null
  setTransactionError: React.Dispatch<React.SetStateAction<any | null>>

  isFrozen: boolean
  setIsFrozen: React.Dispatch<React.SetStateAction<boolean>>
}

export type TransactionStatus = "awaitingWallet" | "processing" | "processed" | null

export const SwapContext = createContext<SwapContextType>({
  quoteOrder: null,
  swapPrice: 0,
  estimatedGasFee: undefined,
  sellAmount: ethers.constants.Zero,
  buyAmount: ethers.constants.Zero,
  sellInput: "",
  buyInput: "",

  setSellInput: (amount: string) => {},
  setBuyInput: (amount: string) => {},

  switchTokens: () => {},

  orderBook: [],

  transactionStatus: null,
  setTransactionStatus: () => {},

  transactionError: null,
  setTransactionError: () => {},

  isFrozen: false,
  setIsFrozen: () => {},
})

function SwapProvider({ children }: Props) {
  const { network, signer, ethersProvider } = useContext(WalletContext)
  const { makerFee, takerFee, buyTokenInfo, sellTokenInfo, exchangeAddress } = useContext(ExchangeContext)

  const [estimatedGasFee, setEstimatedGasFee] = useState<number>(0.0001)
  const [orderBook, setOrderBook] = useState<ZZOrder[]>([])
  const [userInputSide, setUserInputSide] = useState<"buy" | "sell">("sell")
  const [sellInput, setSellInput] = useState<string>("")
  const [buyInput, setBuyInput] = useState<string>("")
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>(null)
  const [transactionError, setTransactionError] = useState<any | null>(null)
  const [isFrozen, setIsFrozen] = useState<boolean>(false)

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

  const [quoteOrder, swapPrice] = useMemo((): [ZZOrder | null, number] => {
    let newQuoteOrder: ZZOrder | null = null
    let newSwapPrice: number = 0
    if (!buyTokenInfo) {
      console.warn("buyTokenInfo is null")
      return [newQuoteOrder, newSwapPrice]
    }
    if (!sellTokenInfo) {
      console.warn("sellTokenInfo is null")
      return [newQuoteOrder, newSwapPrice]
    }

    if (
      (buyTokenInfo.address === ethers.constants.AddressZero || sellTokenInfo.address === ethers.constants.AddressZero) &&
      (buyTokenInfo.address === network?.wethContractAddress || sellTokenInfo.address === network?.wethContractAddress)
    ) {
      const fakeWrapUnwrapOrder: ZZOrder = {
        order: {
          user: "0x0",
          buyToken: "0x0",
          sellToken: "0x0",
          buyAmount: "1",
          sellAmount: "1",
          expirationTimeSeconds: "99999999999999999",
        },
        signature: "0x0",
      }
      return [fakeWrapUnwrapOrder, 1]
    }

    const minTimeStamp: number = Date.now() / 1000 + 12
    for (let i = 0; i < orderBook.length; i++) {
      const { order } = orderBook[i]
      if (minTimeStamp > Number(order.expirationTimeSeconds)) continue

      const parsedBuyInput = getBigNumberFromInput(buyInput, buyTokenInfo.decimals)
      const quoteSellAmount = ethers.BigNumber.from(order.sellAmount)
      if (userInputSide === "buy" && quoteSellAmount.lt(parsedBuyInput)) continue

      const parsedSellInput = getBigNumberFromInput(sellInput, sellTokenInfo.decimals)
      const quoteBuyAmount = ethers.BigNumber.from(order.buyAmount)
      if (userInputSide === "sell" && quoteBuyAmount.lt(parsedSellInput)) continue

      const quoteSellAmountFormated = Number(ethers.utils.formatUnits(quoteSellAmount, buyTokenInfo.decimals))
      const quoteBuyAmountFormated = Number(ethers.utils.formatUnits(quoteBuyAmount, sellTokenInfo.decimals))
      const thisPrice = (quoteSellAmountFormated * (1 - takerFee)) / (quoteBuyAmountFormated * (1 - makerFee))
      if (thisPrice > newSwapPrice) {
        newSwapPrice = thisPrice
        newQuoteOrder = orderBook[i]
      }
    }
    return [newQuoteOrder, newSwapPrice]
  }, [network, buyInput, sellInput, orderBook, buyTokenInfo, sellTokenInfo, makerFee, takerFee])

  const [buyAmount, sellAmount] = useMemo((): [ethers.BigNumber, ethers.BigNumber] => {
    let newBuyAmount: ethers.BigNumber = ethers.constants.Zero
    let newSellAmount: ethers.BigNumber = ethers.constants.Zero
    if (!sellTokenInfo || !buyTokenInfo || !quoteOrder) return [newBuyAmount, newSellAmount]
    const quoteSellAmount = ethers.BigNumber.from(quoteOrder.order.sellAmount)
    const quoteBuyAmount = ethers.BigNumber.from(quoteOrder.order.buyAmount)

    if (userInputSide === "buy") {
      newBuyAmount = getBigNumberFromInput(buyInput, buyTokenInfo.decimals)
      newSellAmount = newBuyAmount.mul(quoteBuyAmount).div(quoteSellAmount)

      if (newSellAmount.eq(0)) {
        setSellInput("")
      } else {
        const newSellAmountFormated = ethers.utils.formatUnits(newSellAmount, sellTokenInfo.decimals)
        setSellInput(prettyBalance(newSellAmountFormated))
      }

      return [newBuyAmount, newSellAmount]
    } else {
      newSellAmount = getBigNumberFromInput(sellInput, sellTokenInfo.decimals)
      newBuyAmount = newSellAmount.mul(quoteSellAmount).div(quoteBuyAmount)

      if (newBuyAmount.eq(0)) {
        setBuyInput("")
      } else {
        const newBuyAmountFormated = ethers.utils.formatUnits(newBuyAmount, buyTokenInfo.decimals)
        setBuyInput(prettyBalance(newBuyAmountFormated))
      }

      return [newBuyAmount, newSellAmount]
    }
  }, [buyInput, sellInput, quoteOrder])

  useEffect(() => {
    const getGasFees = async () => {
      if (!network) {
        console.warn("getGasFees: Missing network")
        return
      }
      if (!ethersProvider) {
        console.warn("getGasFees: missing ethersProvider")
        return
      }
      if (!exchangeAddress) {
        console.warn("getGasFees: missing exchangeAddress")
        return
      }
      if (!quoteOrder) {
        console.warn("getGasFees: missing quoteOrder")
        return
      }

      let estimatedGasUsed = ethers.constants.Zero
      try {
        const feeData = await ethersProvider.getFeeData()
        console.log(feeData)
        if (!feeData.lastBaseFeePerGas || !feeData.gasPrice) {
          console.warn("getGasFees: missing lastBaseFeePerGas")
          return
        }

        if (buyTokenInfo.address === network?.wethContractAddress && sellTokenInfo.address === ethers.constants.AddressZero) {
          // deposit
          if (!wethContract) {
            console.warn("getGasFees: missing wethContract")
            return
          }
          estimatedGasUsed = await wethContract.estimateGas.deposit({ value: "1" })
        } else if (buyTokenInfo.address === ethers.constants.AddressZero && sellTokenInfo.address === network?.wethContractAddress) {
          // withdraw
          if (!wethContract) {
            console.warn("getGasFees: missing wethContract")
            return
          }
          estimatedGasUsed = await wethContract.estimateGas.withdraw("1")
        } else {
          // swap
          if (!exchangeContract) {
            console.warn("getGasFees: missing exchangeContract")
            return
          }

          estimatedGasUsed = await exchangeContract.estimateGas.fillOrder(
            [
              quoteOrder.order.user,
              quoteOrder.order.sellToken,
              quoteOrder.order.buyToken,
              quoteOrder.order.sellAmount,
              quoteOrder.order.buyAmount,
              quoteOrder.order.expirationTimeSeconds,
            ],
            quoteOrder.signature,
            "1",
            false
          )
        }

        const estimatedFeeBigNumber = feeData.lastBaseFeePerGas.mul(0).add(feeData.gasPrice).mul(estimatedGasUsed)
        const estimatedFee = ethers.utils.formatUnits(estimatedFeeBigNumber, network.nativeCurrency.decimals)
        console.log(Number(estimatedFee))
        setEstimatedGasFee(Number(estimatedFee))
      } catch (err: any) {
        console.log(`getGasFees: Failed to estimate gas: ${err.message}`)
        // setEstimatedGasFee(0.0001) // Some estimate
      }
    }
    getGasFees()
  }, [network, signer, exchangeAddress, quoteOrder])

  useEffect(() => {
    if (isFrozen) return
    getOrderBook()

    const refreshOrderBookInterval = setInterval(getOrderBook, 4 * 1000)
    return () => clearInterval(refreshOrderBookInterval)
  }, [network, buyTokenInfo, sellTokenInfo, isFrozen])

  async function getOrderBook() {
    console.log("Getting orderbook....")
    if (!network) {
      console.warn("getOrderBook: Missing network")
      return
    }
    if (!buyTokenInfo) {
      console.warn("getOrderBook: missing buyTokenInfo")
      return
    }
    if (!sellTokenInfo) {
      console.warn("getOrderBook: missing sellTokenInfo")
      return
    }

    let orders: { orders: ZZOrder[] }
    try {
      const minExpires = (Date.now() / 1000 + 11).toFixed(0)
      const response = await fetch(
        `${network.backendUrl}/v1/orders?buyToken=${sellTokenInfo.address}&sellToken=${buyTokenInfo.address}&minExpires=${minExpires}`
      )
      if (response.status !== 200) {
        console.error("Failed to fetch order book.")
        return
      }

      orders = await response.json()
    } catch (err: any) {
      console.error(`Error fetching token price: ${err}`)
      return
    }

    const minTimeStamp: number = Date.now() / 1000 + 10
    const goodOrders = orders.orders.filter((o: ZZOrder) => minTimeStamp < Number(o.order.expirationTimeSeconds))
    setOrderBook(goodOrders)
  }

  const switchTokens = () => {
    if (userInputSide === "sell") {
      setUserInputSide("buy")

      setBuyInput(sellInput)
      setSellInput(buyInput)
    } else {
      setUserInputSide("sell")

      setBuyInput(sellInput)
      setSellInput(buyInput)
    }
  }

  const _setSellInput = (newInput: string) => {
    setUserInputSide("sell")
    setSellInput(newInput)
  }

  const _setBuyInput = (newInput: string) => {
    setUserInputSide("buy")
    setBuyInput(newInput)
  }

  return (
    <SwapContext.Provider
      value={{
        quoteOrder,
        swapPrice,
        estimatedGasFee,
        sellAmount,
        buyAmount,
        sellInput,
        buyInput,

        setSellInput: _setSellInput,
        setBuyInput: _setBuyInput,

        switchTokens,
        orderBook,

        transactionStatus,
        setTransactionStatus,
        transactionError,
        setTransactionError,
        isFrozen,
        setIsFrozen,
      }}
    >
      {children}
    </SwapContext.Provider>
  )
}

export default SwapProvider

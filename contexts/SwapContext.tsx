import React, { useContext, createContext, useEffect, useState, useMemo } from "react"
import { ethers } from "ethers"

import exchangeAbi from "../data/abis/exchange.json"

import { WalletContext } from "./WalletContext"
import { ExchangeContext } from "./ExchangeContext"
import { prettyBalance } from "../utils/utils"

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
  sellAmount: number
  buyAmount: number
  sellInput: string
  buyInput: string

  setSellInput: (amount: string) => void
  setBuyInput: (amount: string) => void

  switchTokens: () => void

  orderBook: ZZOrder[]
}

export const SwapContext = createContext<SwapContextType>({
  quoteOrder: null,
  swapPrice: 0,
  estimatedGasFee: undefined,
  sellAmount: 0,
  buyAmount: 0,
  sellInput: "",
  buyInput: "",

  setSellInput: (amount: string) => {},
  setBuyInput: (amount: string) => {},

  switchTokens: () => {},

  orderBook: [],
})

function SwapProvider({ children }: Props) {
  const [estimatedGasFee, setEstimatedGasFee] = useState<number | undefined>()
  const [orderBook, setOrderBook] = useState<ZZOrder[]>([])
  const [userInputSide, setUserInputtSide] = useState<"buy" | "sell">("sell")
  const [sellInput, setSellInput] = useState<string>("")
  const [buyInput, setBuyInput] = useState<string>("")

  const { network, signer } = useContext(WalletContext)
  const { makerFee, takerFee, buyTokenInfo, sellTokenInfo, exchangeAddress } = useContext(ExchangeContext)

  const exchangeContract: ethers.Contract | null = useMemo(() => {
    if (exchangeAddress && signer) {
      return new ethers.Contract(exchangeAddress, exchangeAbi, signer)
    }
    return null
  }, [exchangeAddress, signer])
  
  const [quoteOrder, swapPrice] = useMemo((): [ZZOrder | null, number] => {
    let newQuoteAmount: ZZOrder | null = null
    let newSwapPrice: number = 0
    if (!buyTokenInfo) {
      console.warn("buyTokenInfo is null")
      return [newQuoteAmount, newSwapPrice]
    }
    if (!sellTokenInfo) {
      console.warn("sellTokenInfo is null")
      return [newQuoteAmount, newSwapPrice]
    }

    if (
      (buyTokenInfo.address === ethers.constants.AddressZero || sellTokenInfo.address === ethers.constants.AddressZero) &&
      (buyTokenInfo.address === network?.wethContractAddress || sellTokenInfo.address === network?.wethContractAddress)
    ) {
      return [newQuoteAmount, 1]
    }

    const minTimeStamp: number = Date.now() / 1000 + 15
    for (let i = 0; i < orderBook.length; i++) {
      const { order } = orderBook[i]
      if (minTimeStamp > Number(order.expirationTimeSeconds)) continue
      const quoteBuyAmount = Number(ethers.utils.formatUnits(order.buyAmount, sellTokenInfo.decimals))
      const quoteSellAmount = Number(ethers.utils.formatUnits(order.sellAmount, buyTokenInfo.decimals))
      if (
        userInputSide === "buy" && 
        buyInput && Number(buyInput) && 
        quoteSellAmount < Number(buyInput)
      ) continue
      if (
        userInputSide === "sell" &&
        sellInput && Number(sellInput) &&
        quoteBuyAmount < Number(sellInput)
      ) continue

      const thisPrice = (quoteSellAmount * (1 - takerFee)) / (quoteBuyAmount * (1 - makerFee))
      if (thisPrice > newSwapPrice) {
        newSwapPrice = thisPrice
        newQuoteAmount = orderBook[i]
      }
    }
    return [newQuoteAmount, newSwapPrice]
  }, [network, buyInput, sellInput, orderBook, buyTokenInfo, sellTokenInfo, makerFee, takerFee])

  const [buyAmount, sellAmount] = useMemo((): [number, number] => {
    let newBuyAmount: number = 0
    let newSellAmount: number = 0
    if (userInputSide === "buy") {
      if (!swapPrice) return [newBuyAmount, newSellAmount]
      newBuyAmount = Number(buyInput)
      newSellAmount = Number(buyInput) / swapPrice
      setSellInput(prettyBalance(newSellAmount))
      return [newBuyAmount, newSellAmount]
    } else {
      if (!swapPrice) return [newBuyAmount, newSellAmount]
      newBuyAmount = Number(sellInput) * swapPrice
      newSellAmount = Number(sellInput)

      setBuyInput(prettyBalance(newBuyAmount))
      return [newBuyAmount, newSellAmount]
    }
  }, [buyInput, sellInput, swapPrice])

  useEffect(() => {
    const getGasFees = async () => {
      if (!network) {
        console.warn("getGasFees: Missing network")
        return
      }
      if (!signer) {
        console.warn("getGasFees: missing signer")
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

      if (!exchangeContract) {
        console.warn("getGasFees: missing exchangeContract")
        return
      }

      let estimatedGasUsed = ethers.constants.Zero
      try {
        const feeData = await signer.getFeeData()
        if (!feeData.lastBaseFeePerGas) {
          console.warn("getGasFees: missing lastBaseFeePerGas")
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

        const estimatedFeeBigNumber = feeData.lastBaseFeePerGas.mul(estimatedGasUsed)
        const estimatedFee = ethers.utils.formatUnits(estimatedFeeBigNumber, network.nativeCurrency.decimals)
        setEstimatedGasFee(Number(estimatedFee))
      } catch (err: any) {
        console.log(`getGasFees: Failed to estimate gas: ${err.message}`)
        setEstimatedGasFee(undefined)
      }
    }
    getGasFees()
  }, [network, signer, exchangeAddress, quoteOrder])

  useEffect(() => {
    getOrderBook()

    const refreshOrderBookInterval = setInterval(() => {
      getOrderBook()
    }, 5 * 1000)
    return () => clearInterval(refreshOrderBookInterval)
  }, [network, buyTokenInfo, sellTokenInfo])

  async function getOrderBook() {
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
      const response = await fetch(`${network.backendUrl}/v1/orders?buyToken=${sellTokenInfo.address}&sellToken=${buyTokenInfo.address}`)
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
      setUserInputtSide("buy")

      setBuyInput(sellInput)
      setSellInput(buyInput)
    } else {
      setUserInputtSide("sell")

      setBuyInput(sellInput)
      setSellInput(buyInput)
    }   
  }

  const _setSellInput = (newInput: string) => {
    setUserInputtSide("sell")
    setSellInput(newInput)
  }

  const _setBuyInput = (newInput: string) => {
    setUserInputtSide("buy")
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
      }}
    >
      {children}
    </SwapContext.Provider>
  )
}

export default SwapProvider

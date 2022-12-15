import React, { useContext, createContext, useEffect, useState, useMemo } from "react"
import { ethers } from "ethers"

import exchangeAbi from "../data/abis/exchange.json"

import { WalletContext } from "./WalletContext"
import { ExchangeContext } from "./ExchangeContext"

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
  estimatedGasFee: number
  sellAmount: number
  buyAmount: number

  setSellAmount: (amount: number) => void
  setBuyAmount: (amount: number) => void
}

export const SwapContext = createContext<SwapContextType>({
  quoteOrder: null,
  swapPrice: 0,
  estimatedGasFee: 0,
  sellAmount: 0,
  buyAmount: 0,

  setSellAmount: (amount: number) => {},
  setBuyAmount: (amount: number) => {},
})

function SwapProvider({ children }: Props) {
  const [sellAmount, setSellAmount] = useState<number>(0)
  const [buyAmount, setBuyAmount] = useState<number>(0)
  const [estimatedGasFee, setEstimatedGasFee] = useState<number>(0)
  const [orderBook, setOrderBook] = useState<ZZOrder[]>([])

  const { network, signer } = useContext(WalletContext)
  const { makerFee, takerFee, buyTokenInfo, sellTokenInfo, exchangeAddress } = useContext(ExchangeContext)

  const [quoteOrder, swapPrice] = useMemo((): [ZZOrder | null, number] => {
    if (!buyTokenInfo) {
      console.warn("buyTokenInfo is null")
      return [null, 0]
    }
    if (!sellTokenInfo) {
      console.warn("sellTokenInfo is null")
      return [null, 0]
    }

    const minTimeStamp: number = Date.now() / 1000 + 10
    let bestOrder: ZZOrder | null = null
    let bestPrice: number = 0
    for (let i = 0; i < orderBook.length; i++) {
      const { order } = orderBook[i]

      if (minTimeStamp < Number(order.expirationTimeSeconds)) continue
      const quoteSellAmount = Number(ethers.utils.formatUnits(order.sellAmount, buyTokenInfo.decimals))
      if (quoteSellAmount < buyAmount) continue

      const quoteBuyAmount = Number(ethers.utils.formatUnits(order.buyAmount, sellTokenInfo.decimals))
      const thisPrice = (quoteBuyAmount * (1 - makerFee)) / (quoteSellAmount * (1 - takerFee))
      if (thisPrice > bestPrice) {
        bestPrice = thisPrice
        bestOrder = orderBook[i]
      }
    }
    return [bestOrder, bestPrice]
  }, [orderBook, buyAmount, buyTokenInfo, sellTokenInfo, makerFee, takerFee])

  useEffect(() => {
    const getGasFees = async () => {
      if (!network) {
        console.warn("getGasFees: missing network")
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

      const feeData = await signer.getFeeData()
      if (!feeData.lastBaseFeePerGas || !feeData.maxPriorityFeePerGas) {
        console.warn("getGasFees: missing lastBaseFeePerGas or maxPriorityFeePerGas")
        return
      }

      const exchangeContract = new ethers.Contract(exchangeAddress, exchangeAbi, signer)
      let estimatedGasUsed = ethers.constants.Zero
      try {
        estimatedGasUsed = await exchangeContract.estimateGas.fillOrder(
          [
            quoteOrder.order.user,
            quoteOrder.order.sellToken,
            quoteOrder.order.buyToken,
            quoteOrder.order.sellAmount,
            quoteOrder.order.buyAmount,
            quoteOrder.order.expirationTimeSeconds
          ],
          quoteOrder.signature,
          buyAmount.toString(),
          false
        )
      } catch (err: any) {
        console.log(`getGasFees: Failed to estimate gas: ${err.message}`)
      }

      const estimatedFeeBigNumber = feeData.lastBaseFeePerGas.add(feeData.maxPriorityFeePerGas).mul(estimatedGasUsed)
      const estimatedFee = ethers.utils.formatUnits(estimatedFeeBigNumber, network.nativeCurrency.decimals)
      setEstimatedGasFee(Number(estimatedFee))
    }
    getGasFees()

    const interval = setInterval(getGasFees, 15000)
    return () => clearInterval(interval)
  }, [network, signer, exchangeAddress, quoteOrder])

  useEffect(() => {
    setBuyAndSellSize(null, sellAmount)
  }, [quoteOrder])

  useEffect(() => {
    getOrderBook()

    const refreshOrderBookInterval = setInterval(() => {
      getOrderBook()
    }, 5 * 1000)
    return () => clearInterval(refreshOrderBookInterval)
  }, [network, buyTokenInfo, sellTokenInfo])

  async function getOrderBook() {
    if (!network) {
      console.warn("getOrderBook: missing network")
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

    const response = await fetch(
      `${network.backendUrl}/v1/orders?buyToken=${sellTokenInfo.address}&sellToken=${buyTokenInfo.address}&expires=1672157228`
    )
    if (response.status !== 200) {
      console.error("Failed to fetch order book.")
      return
    }

    const orders: { "orders": ZZOrder[] } = await response.json()
    setOrderBook(orders.orders)
  }

  function setBuyAndSellSize(buyAmout: number | null, sellAmount: number | null) {
    // no price -> reset other side
    if (!swapPrice) {
      if (sellAmount) setBuyAmount(0)
      if (buyAmout) setSellAmount(0)
      return
    }

    if (sellAmount) {
      const newBuyAmount = sellAmount * swapPrice
      setBuyAmount(newBuyAmount)
      setSellAmount(sellAmount)
    } else if (buyAmout) {
      const newSellAmount = buyAmout / swapPrice
      setBuyAmount(buyAmout)
      setSellAmount(newSellAmount)
    }
  }

  const _setSellAmount = (newSellAmount: number) => {
    if (newSellAmount) {
      setBuyAndSellSize(null, newSellAmount)
    } else {
      setBuyAmount(0)
      setSellAmount(0)
    }
  }

  const _setBuyAmount = (newBuyAmount: number) => {
    if (newBuyAmount) {
      setBuyAndSellSize(newBuyAmount, null)
    } else {
      setBuyAmount(0)
      setSellAmount(0)
    }
  }

  return (
    <SwapContext.Provider
      value={{
        quoteOrder: quoteOrder,
        swapPrice: swapPrice,
        estimatedGasFee: estimatedGasFee,
        sellAmount: sellAmount,
        buyAmount: buyAmount,

        setSellAmount: _setSellAmount,
        setBuyAmount: _setBuyAmount,
      }}
    >
      {children}
    </SwapContext.Provider>
  )
}

export default SwapProvider

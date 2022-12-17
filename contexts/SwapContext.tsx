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
  estimatedGasFee: number | undefined
  sellAmount: number
  buyAmount: number

  setSellAmount: (amount: number) => void
  setBuyAmount: (amount: number) => void

  switchTokens: () => void

  orderBook: ZZOrder[]
}

export const SwapContext = createContext<SwapContextType>({
  quoteOrder: null,
  swapPrice: 0,
  estimatedGasFee: undefined,
  sellAmount: 0,
  buyAmount: 0,

  setSellAmount: (amount: number) => {},
  setBuyAmount: (amount: number) => {},

  switchTokens: () => {},

  orderBook: [],
})

function SwapProvider({ children }: Props) {
  const [sellAmount, setSellAmount] = useState<number>(0)
  const [estimatedGasFee, setEstimatedGasFee] = useState<number | undefined>()
  const [orderBook, setOrderBook] = useState<ZZOrder[]>([])

  const { network, signer } = useContext(WalletContext)
  const { makerFee, takerFee, buyTokenInfo, sellTokenInfo, exchangeAddress } = useContext(ExchangeContext)

  const [quoteOrder, swapPrice, buyAmount] = useMemo((): [ZZOrder | null, number, number] => {
    let newQuoteAmount: ZZOrder | null = null
    let newSwapPrice: number = 0
    let newBuyAmount: number = 0    
    if (!buyTokenInfo) {
      console.warn("buyTokenInfo is null")
      return [newQuoteAmount, newSwapPrice, newBuyAmount]
    }
    if (!sellTokenInfo) {
      console.warn("sellTokenInfo is null")
      return [newQuoteAmount, newSwapPrice, newBuyAmount]
    }

    if (
      (buyTokenInfo.address === ethers.constants.AddressZero || sellTokenInfo.address === ethers.constants.AddressZero) &&
      (buyTokenInfo.address === network?.wethContractAddress || sellTokenInfo.address === network?.wethContractAddress)
    ) {
      return [newQuoteAmount, newSwapPrice, newBuyAmount]
    }

    const minTimeStamp: number = Date.now() / 1000 + 15
    for (let i = 0; i < orderBook.length; i++) {
      const { order } = orderBook[i]
      if (minTimeStamp > Number(order.expirationTimeSeconds)) continue
      const quoteBuyAmount = Number(ethers.utils.formatUnits(order.buyAmount, sellTokenInfo.decimals))
      if (quoteBuyAmount < sellAmount) continue

      const quoteSellAmount = Number(ethers.utils.formatUnits(order.sellAmount, buyTokenInfo.decimals))
      const thisPrice = (quoteSellAmount * (1 - takerFee)) / (quoteBuyAmount * (1 - makerFee))
      if (thisPrice > newSwapPrice) {
        newSwapPrice = thisPrice
        newQuoteAmount = orderBook[i]
      }
    }
    newBuyAmount = sellAmount * newSwapPrice
    return [newQuoteAmount, newSwapPrice, newBuyAmount]
  }, [network, sellAmount, orderBook, buyTokenInfo, sellTokenInfo, makerFee, takerFee])

  const exchangeContract: ethers.Contract | null = useMemo(() => {
    if (exchangeAddress && signer) {
      return new ethers.Contract(exchangeAddress, exchangeAbi, signer)
    }
    return null
  }, [exchangeAddress, signer])

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
      if (!buyTokenInfo) {
        console.warn("getGasFees: missing buyTokenInfo")
        return
      }

      if (!exchangeContract) {
        console.warn("getGasFees: missing exchangeContract")
        return
      }

      const buyAmountParsed = ethers.utils.parseUnits(buyAmount.toFixed(buyTokenInfo.decimals), buyTokenInfo.decimals)
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
          buyAmountParsed,
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
  
  const _setSellAmount = (newSellAmount: number) => {
    if (newSellAmount) {
      setSellAmount(newSellAmount)
    } else {
      setSellAmount(0)
    }
  }

  const _setBuyAmount = (newBuyAmount: number) => {
    if (newBuyAmount) {
      const newSellAmount = newBuyAmount / swapPrice
      _setSellAmount(newSellAmount)
    } else {
      setSellAmount(0)
    }
  }

  const switchTokens = () => {
    setSellAmount(buyAmount)
  }

  return (
    <SwapContext.Provider
      value={{
        quoteOrder,
        swapPrice,
        estimatedGasFee,
        sellAmount,
        buyAmount,

        setSellAmount: _setSellAmount,
        setBuyAmount: _setBuyAmount,

        switchTokens,
        orderBook,
      }}
    >
      {children}
    </SwapContext.Provider>
  )
}

export default SwapProvider

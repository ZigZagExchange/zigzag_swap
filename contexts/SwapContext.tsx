import React, { useContext, createContext, useEffect, useState } from "react"
import { ethers } from "ethers"

import exchangeAbi from '../data/abis/exchange.json'

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

  setSellAmount: ((amount: number) => void)
  setBuyAmount: ((amount: number) => void)
}

export const SwapContext = createContext<SwapContextType>({
  quoteOrder: null,
  swapPrice: 0,
  estimatedGasFee: 0,
  sellAmount: 0,
  buyAmount: 0,

  setSellAmount: ((amount: number) => { }),
  setBuyAmount: ((amount: number) => { })
})

function SwapProvider({ children }: Props) {
  const [quoteOrder, setQuoteOrder] = useState<ZZOrder | null>({order: {
    user: "0x0",
    buyToken: "1",
    sellToken: "5",
    buyAmount: "5000000000000",
    sellAmount: "1",
    expirationTimeSeconds: "1",
  },
  signature: "0x0"})
  const [swapPrice, setSwapPrice] = useState<number>(1)
  const [sellAmount, setSellAmount] = useState<number>(0)
  const [buyAmount, setBuyAmount] = useState<number>(0)
  const [estimatedGasFee, setEstimatedGasFee] = useState<number>(0)

  const { network, ethersProvider } = useContext(WalletContext)
  const { buyTokenInfo, sellTokenInfo, exchangeAddress } = useContext(ExchangeContext)

  useEffect(() => {
    if (!quoteOrder || !buyTokenInfo || !sellTokenInfo) return

    // here buy and sell token infos are inverted
    const quoteSellAmount = Number(ethers.utils.formatUnits(quoteOrder.order.sellAmount, buyTokenInfo.decimals))
    const quoteBuyAmount = Number(ethers.utils.formatUnits(quoteOrder.order.buyAmount, sellTokenInfo.decimals))
    setSwapPrice(quoteSellAmount / quoteBuyAmount)
  }, [quoteOrder])

  useEffect(() => {
    const getGasFees = async () => {
      if (!network || !ethersProvider || !exchangeAddress || !quoteOrder) {
        console.log("getGasFees: missing network, ethersProvider, exchangeAddress or quoteOrder")
        return
      }
      const feeData = await ethersProvider.getFeeData()
      if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
        console.log("getGasFees: missing maxFeePerGas or maxPriorityFeePerGas")
        return
      }
      const exchangeContract = new ethers.Contract(exchangeAddress, exchangeAbi, ethersProvider)
      let estimatedGasUsed = ethers.constants.Zero
      try {
        estimatedGasUsed = await exchangeContract.estimateGas.fillOrder(
          Object.values(quoteOrder.order),
          quoteOrder.signature,
          sellAmount.toString(),
          false
        )
      } catch (err: any) {
        console.log(`getGasFees: Failed to estimate gas: ${err.message}`)
      }
      const estimatedFeeBigNumber = feeData.maxFeePerGas.add(feeData.maxPriorityFeePerGas).mul(estimatedGasUsed)
      const estimatedFee = ethers.utils.formatUnits(estimatedFeeBigNumber, network.nativeCurrency.decimals)
      setEstimatedGasFee(Number(estimatedFee))
    }
    getGasFees()

    const interval = setInterval(getGasFees, 15000)
    return () => clearInterval(interval)
  }, [quoteOrder, network, ethersProvider, exchangeAddress])

  function setBuyAndSellSize(buyAmout: number | null, sellAmount: number | null) {
    if (!swapPrice) return
    
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

  useEffect(() => {
    setBuyAndSellSize(null, sellAmount)
  }, [quoteOrder])

  const _setSellAmount = (newSellAmount: number) => {
    setBuyAndSellSize(null, newSellAmount)
  }

  const _setBuyAmount = (newBuyAmount: number) => {
    setBuyAndSellSize(newBuyAmount, null)
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
        setBuyAmount: _setBuyAmount
      }}
    >
      {children}
    </SwapContext.Provider>
  )
}

export default SwapProvider
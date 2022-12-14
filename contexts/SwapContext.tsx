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

  setSellSize: ((amount: ethers.BigNumber) => void)
}

export const SwapContext = createContext<SwapContextType>({
  quoteOrder: null,
  swapPrice: 0,
  estimatedGasFee: 0,


  setSellSize: ((amount: ethers.BigNumber) => {})
})

function SwapProvider({ children }: Props) {
  const [quoteOrder, setQuoteOrder] = useState<ZZOrder | null>(null)
  const [swapPrice, setSwapPrice] = useState<number>(0)
  const [sellSize, setSellSize] = useState<ethers.BigNumber>(ethers.constants.Zero)
  const [estimatedGasFee, setEstimatedGasFee] = useState<number>(0)

  const { network, ethersProvider } = useContext(WalletContext)
  const { buyTokenInfo, sellTokenInfo, exchangeAddress } = useContext(ExchangeContext)

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
          sellSize.toString(),
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

  return (
    <SwapContext.Provider
      value={{
        quoteOrder: quoteOrder,
        swapPrice: swapPrice,
        estimatedGasFee: estimatedGasFee,

        setSellSize: setSellSize
      }}
    >
      {children}
    </SwapContext.Provider>
  )
}

export default SwapProvider
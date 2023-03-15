import React, { useContext, createContext, useEffect, useState, useMemo } from "react"
import { constants, ethers } from "ethers"

import exchangeAbi from "../data/abis/ZigZagExchange.json"

import { WalletContext } from "./WalletContext"
import { ExchangeContext } from "./ExchangeContext"
import { getBigNumberFromInput, prettyBalance, truncateDecimals } from "../utils/utils"

interface Props {
  children: React.ReactNode
}

export type RouteMarket = {
  buyTokenAddress: string
  sellTokenAddress: string
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
  quoteOrderRoutingArray: ZZOrder[]
  swapPrice: number
  estimatedGasFee: number | undefined
  sellAmount: ethers.BigNumber
  buyAmount: ethers.BigNumber
  sellInput: string
  buyInput: string
  userInputSide: "buy" | "sell"

  setSellInput: (amount: string) => void
  setBuyInput: (amount: string) => void

  switchTokens: () => void

  orderBook: { [key: string]: ZZOrder[] }

  transactionStatus: TransactionStatus
  setTransactionStatus: React.Dispatch<React.SetStateAction<TransactionStatus>>

  transactionError: any | null
  setTransactionError: React.Dispatch<React.SetStateAction<any | null>>

  isFrozen: boolean
  setIsFrozen: React.Dispatch<React.SetStateAction<boolean>>

  selectSellToken: (newTokenAddress: string) => void
  selectBuyToken: (newTokenAddress: string) => void

  tokensChanged: boolean

  swapRoute: RouteMarket[]
}

export type TransactionStatus = "awaitingWallet" | "processing" | "processed" | null

export const SwapContext = createContext<SwapContextType>({
  quoteOrderRoutingArray: [],
  swapPrice: 0,
  estimatedGasFee: undefined,
  sellAmount: ethers.constants.Zero,
  buyAmount: ethers.constants.Zero,
  sellInput: "",
  buyInput: "",
  userInputSide: "buy",

  setSellInput: (amount: string) => { },
  setBuyInput: (amount: string) => { },

  switchTokens: () => { },

  orderBook: {},

  transactionStatus: null,
  setTransactionStatus: () => { },

  transactionError: null,
  setTransactionError: () => { },

  isFrozen: false,
  setIsFrozen: () => { },

  selectSellToken: (newTokenAddress: string) => { },
  selectBuyToken: (newTokenAddress: string) => { },

  tokensChanged: false,

  swapRoute: [],
})

function SwapProvider({ children }: Props) {
  const { network, signer, ethersProvider } = useContext(WalletContext)
  const { makerFee, takerFee, buyTokenInfo, sellTokenInfo, exchangeAddress, markets, setBuyToken, setSellToken, getTokenInfo, getTokens } =
    useContext(ExchangeContext)

  const [quoteOrderRoutingArray, setQuoteOrderRoutingArray] = useState<ZZOrder[]>([])
  const [swapPrice, setSwapPrice] = useState<number>(0)
  const [estimatedGasFee, setEstimatedGasFee] = useState<number>(0.0001)
  const [orderBook, setOrderBook] = useState<{ [key: string]: ZZOrder[] }>({})
  const [userInputSide, setUserInputSide] = useState<"buy" | "sell">("sell")
  const [sellInput, setSellInput] = useState<string>("")
  const [buyInput, setBuyInput] = useState<string>("")
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>(null)
  const [transactionError, setTransactionError] = useState<any | null>(null)
  const [isFrozen, setIsFrozen] = useState<boolean>(false)
  const [tokensChanged, setTokensChanged] = useState<boolean>(false)
  const [possibleSwapRoute, setPossibleSwapRoute] = useState<RouteMarket[][]>([])
  const [swapRoute, setSwapRoute] = useState<RouteMarket[]>([])

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

  useEffect(() => {
    console.log("quoteOrderRoutingArray,swapPrice recomputed")

    let newQuoteOrderArray: ZZOrder[] = []
    let newSwapPrice: number = 0
    if (!buyTokenInfo) {
      console.warn("buyTokenInfo is null")
      setQuoteOrderRoutingArray(newQuoteOrderArray)
      setSwapPrice(newSwapPrice)
      setSwapRoute([])
      return
    }
    if (!sellTokenInfo) {
      console.warn("sellTokenInfo is null")
      setQuoteOrderRoutingArray(newQuoteOrderArray)
      setSwapPrice(newSwapPrice)
      setSwapRoute([])
      return
    }

    if (buyTokenInfo.address === ethers.constants.AddressZero && sellTokenInfo.address === network?.wethContractAddress) {
      const fakeWrapOrder: ZZOrder[] = [{
        order: {
          user: "0x0",
          buyToken: "0x0",
          sellToken: "0x0",
          buyAmount: ethers.constants.MaxUint256.toString(),
          sellAmount: ethers.constants.MaxUint256.toString(),
          expirationTimeSeconds: "99999999999999999",
        },
        signature: "0x0",
      }]
      setQuoteOrderRoutingArray(fakeWrapOrder)
      setSwapRoute([{ buyTokenAddress: ethers.constants.AddressZero, sellTokenAddress: network?.wethContractAddress }])
      setSwapPrice(1)
      return
    }

    if (buyTokenInfo.address === network?.wethContractAddress && sellTokenInfo.address === ethers.constants.AddressZero) {
      const fakeUnwrapOrder: ZZOrder[] = [{
        order: {
          user: "0x0",
          buyToken: "0x0",
          sellToken: "0x0",
          buyAmount: ethers.constants.MaxUint256.toString(),
          sellAmount: ethers.constants.MaxUint256.toString(),
          expirationTimeSeconds: "99999999999999999",
        },
        signature: "0x0",
      }]
      setQuoteOrderRoutingArray(fakeUnwrapOrder)
      setSwapRoute([{ buyTokenAddress: network?.wethContractAddress, sellTokenAddress: ethers.constants.AddressZero }])
      setSwapPrice(1)
      return
    }

    let bestSwapRoute: RouteMarket[] = []
    const userBuyInputParsed = getBigNumberFromInput(buyInput, buyTokenInfo.decimals)
    const minTimeStamp: number = Date.now() / 1000 + 5
    possibleSwapRoute.forEach((route: RouteMarket[]) => {
      let routeSwapPrice = 0
      const routeQuoteOrderArray: ZZOrder[] = []
      let stepBuyAmount = userBuyInputParsed
      route.forEach((market: RouteMarket) => {
        let marketSwapPrice = 0
        let marketQuoteOrder: ZZOrder | undefined
        const key = `${market.buyTokenAddress}-${market.sellTokenAddress}`
        const currentOrderBook = orderBook[key]
        if (!currentOrderBook) return

        for (let i = 0; i < currentOrderBook.length; i++) {
          const { order } = currentOrderBook[i]
          if (minTimeStamp > Number(order.expirationTimeSeconds)) return

          const quoteSellAmount = ethers.BigNumber.from(order.sellAmount)
          const quoteBuyAmount = ethers.BigNumber.from(order.buyAmount)
          if (userInputSide === "buy" && quoteSellAmount.lt(stepBuyAmount)) return

          const quoteSellTokenInfo = getTokenInfo(order.sellToken)
          const quoteBuyTokenInfo = getTokenInfo(order.buyToken)
          if (!quoteSellTokenInfo || !quoteBuyTokenInfo) return
          const quoteSellAmountFormated = Number(ethers.utils.formatUnits(quoteSellAmount, quoteSellTokenInfo.decimals))
          const quoteBuyAmountFormated = Number(ethers.utils.formatUnits(quoteBuyAmount, quoteBuyTokenInfo.decimals))
          const thisPrice = (quoteSellAmountFormated * (1 - takerFee)) / (quoteBuyAmountFormated * (1 - makerFee))
          if (thisPrice > marketSwapPrice) {
            marketSwapPrice = thisPrice
            marketQuoteOrder = currentOrderBook[i]
          }
        }
        routeSwapPrice = routeSwapPrice ? routeSwapPrice * marketSwapPrice : marketSwapPrice
        if (marketQuoteOrder) {
          routeQuoteOrderArray.push(marketQuoteOrder)
          stepBuyAmount.mul(marketQuoteOrder.order.buyAmount).div(marketQuoteOrder.order.sellAmount)
        }
      })

      if (routeSwapPrice > newSwapPrice) {
        newSwapPrice = routeSwapPrice
        newQuoteOrderArray = routeQuoteOrderArray
        bestSwapRoute = route
      }
    })
    setSwapRoute(bestSwapRoute)
    setQuoteOrderRoutingArray(newQuoteOrderArray)
    setSwapPrice(newSwapPrice)
  }, [network, buyInput, sellInput, orderBook, buyTokenInfo, sellTokenInfo, makerFee, takerFee, possibleSwapRoute])

  const [buyAmount, sellAmount] = useMemo((): [ethers.BigNumber, ethers.BigNumber] => {
    let newBuyAmount: ethers.BigNumber = ethers.constants.Zero
    let newSellAmount: ethers.BigNumber = ethers.constants.Zero
    if (!sellTokenInfo || !buyTokenInfo || quoteOrderRoutingArray.length === 0) return [newBuyAmount, newSellAmount]


    if (userInputSide === "buy") {
      newBuyAmount = getBigNumberFromInput(buyInput, buyTokenInfo.decimals)

      newSellAmount = newBuyAmount
      quoteOrderRoutingArray.forEach((quoteOrder: ZZOrder) => {
        const quoteSellAmount = ethers.BigNumber.from(quoteOrder.order.sellAmount)
        const quoteBuyAmount = ethers.BigNumber.from(quoteOrder.order.buyAmount)

        newSellAmount = newSellAmount.mul(quoteBuyAmount).div(quoteSellAmount)
      })

      if (newSellAmount.eq(0)) {
        setSellInput("")
      } else {
        const newSellAmountFormated = ethers.utils.formatUnits(newSellAmount, sellTokenInfo.decimals)
        setSellInput(prettyBalance(newSellAmountFormated))
      }

      return [newBuyAmount, newSellAmount]
    } else {
      newSellAmount = getBigNumberFromInput(sellInput, sellTokenInfo.decimals)

      newBuyAmount = newSellAmount
      quoteOrderRoutingArray.forEach((quoteOrder: ZZOrder) => {
        const quoteSellAmount = ethers.BigNumber.from(quoteOrder.order.sellAmount)
        const quoteBuyAmount = ethers.BigNumber.from(quoteOrder.order.buyAmount)

        newBuyAmount = newBuyAmount.mul(quoteSellAmount).div(quoteBuyAmount)
      })

      if (newBuyAmount.eq(0)) {
        setBuyInput("")
      } else {
        const newBuyAmountFormated = ethers.utils.formatUnits(newBuyAmount, buyTokenInfo.decimals)
        setBuyInput(prettyBalance(newBuyAmountFormated))
      }

      return [newBuyAmount, newSellAmount]
    }
  }, [buyInput, sellInput, swapPrice])

  useEffect(() => {
    const getGasFees = async () => {
      try {
        if (!network) throw new Error("getGasFees: Missing network")
        if (!ethersProvider) throw new Error("getGasFees: missing ethersProvider")
        if (!exchangeAddress) throw new Error("getGasFees: missing exchangeAddress")
        if (quoteOrderRoutingArray.length === 0) throw new Error("getGasFees: missing quoteOrderRoutingArray")
        if (!buyTokenInfo) throw new Error("getGasFees: missing buyTokenInfo")
        if (!sellTokenInfo) throw new Error("getGasFees: missing sellTokenInfo")

        const feeData = await ethersProvider.getFeeData()
        if (!feeData.lastBaseFeePerGas || !feeData.gasPrice) throw new Error("getGasFees: missing lastBaseFeePerGas")

        let estimatedGasUsed: ethers.BigNumber
        if (buyTokenInfo.address === network?.wethContractAddress && sellTokenInfo.address === ethers.constants.AddressZero) {
          // deposit
          if (!wethContract) throw new Error("getGasFees: missing wethContract")
          estimatedGasUsed = await wethContract.estimateGas.deposit({ value: "1" })
        } else if (buyTokenInfo.address === ethers.constants.AddressZero && sellTokenInfo.address === network?.wethContractAddress) {
          // withdraw
          if (!wethContract) throw new Error("getGasFees: missing wethContract")
          estimatedGasUsed = await wethContract.estimateGas.withdraw("1")
        } else {
          // swap
          if (!exchangeContract) throw new Error("getGasFees: missing exchangeContract")

          const quoteOrder = quoteOrderRoutingArray[0]
          estimatedGasUsed = await exchangeContract.estimateGas.fillOrderExactInput(
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
          estimatedGasUsed = estimatedGasUsed.mul(quoteOrderRoutingArray.length)
        }

        const estimatedFeeBigNumber = feeData.lastBaseFeePerGas.mul(0).add(feeData.gasPrice).mul(estimatedGasUsed)
        const estimatedFee = ethers.utils.formatUnits(estimatedFeeBigNumber, network.nativeCurrency.decimals)
        setEstimatedGasFee(Number(estimatedFee))
      } catch (err: any) {
        console.warn("Failed to estimate gasFee:", err.message)
        // Some estimate
        setEstimatedGasFee(0.0001 * quoteOrderRoutingArray.length)
      }
    }
    getGasFees()
  }, [network, signer, exchangeAddress, quoteOrderRoutingArray])

  useEffect(() => {
    if (isFrozen) return
    getOrderBook()

    const refreshOrderBookInterval = setInterval(getOrderBook, 4 * 1000)
    return () => clearInterval(refreshOrderBookInterval)
  }, [network, markets, buyTokenInfo, sellTokenInfo, isFrozen])

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

    if (
      (buyTokenInfo.address === ethers.constants.AddressZero || sellTokenInfo.address === ethers.constants.AddressZero) &&
      (buyTokenInfo.address === network.wethContractAddress || sellTokenInfo.address === network.wethContractAddress)
    ) {
      setTokensChanged(false)
      console.warn("getOrderBook: dont fetch for wrap/unwrap")
      return
    }

    const modifiedBuyTokenAddress = buyTokenInfo.address === ethers.constants.AddressZero ? network.wethContractAddress : buyTokenInfo.address
    const modifiedSellTokenAddress = sellTokenInfo.address === ethers.constants.AddressZero ? network.wethContractAddress : sellTokenInfo.address
    if (!modifiedBuyTokenAddress || !modifiedSellTokenAddress) {
      console.warn("getOrderBook: missing sell/buy token address")
      return
    }

    let newRoute: RouteMarket[][] = []
    // check direct route
    const tradeMarket = `${modifiedSellTokenAddress}-${modifiedBuyTokenAddress}`
    if (markets.includes(tradeMarket)) {
      newRoute.push([
        { buyTokenAddress: modifiedSellTokenAddress, sellTokenAddress: modifiedBuyTokenAddress }
      ])
    }
    // check route via other tokens
    if (newRoute.length === 0) {
      const possibleRouts = [
        "0x82af49447d8a07e3bd95bd0d56f35241523fbab1", // weth
        "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", // usdc
        "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9" // usdt
      ]
      possibleRouts.forEach(routeTokenAddress => {
        if (!modifiedSellTokenAddress || !modifiedBuyTokenAddress) return

        const firstTradeMarket = `${modifiedSellTokenAddress}-${routeTokenAddress}`
        const secondTradeMarket = `${routeTokenAddress}-${modifiedBuyTokenAddress}`
        if (markets.includes(firstTradeMarket) && markets.includes(secondTradeMarket)) {
          newRoute.push([
            { buyTokenAddress: modifiedSellTokenAddress, sellTokenAddress: routeTokenAddress },
            { buyTokenAddress: routeTokenAddress, sellTokenAddress: modifiedBuyTokenAddress }
          ])
        }
      })
    }

    if (newRoute.length === 0) {
      console.warn("getOrderBook: no possible route found")
      setPossibleSwapRoute([])
      return
    } else {
      setPossibleSwapRoute(newRoute)
    }

    const minExpires = (Date.now() / 1000 + 11).toFixed(0)
    const minTimeStamp: number = Date.now() / 1000 + 10
    let orders: { orders: ZZOrder[] }
    const newOrderBook: { [key: string]: ZZOrder[] } = {}
    try {
      const promise0 = newRoute.map(async (routes: RouteMarket[]) => {
        const promise1 = routes.map(async (market: RouteMarket) => {
          const requestSellTokenAddress = market.sellTokenAddress
          const requestBuyTokenAddress = market.buyTokenAddress
          const response = await fetch(
            `${network.backendUrl}/v1/orders?buyToken=${requestBuyTokenAddress}&sellToken=${requestSellTokenAddress}&minExpires=${minExpires}`
          )
          if (response.status !== 200) {
            console.error("Failed to fetch order book.")
            setTokensChanged(false)
            return
          }

          orders = await response.json()
          const goodOrders = orders.orders.filter((o: ZZOrder) => minTimeStamp < Number(o.order.expirationTimeSeconds))
          const key = `${requestBuyTokenAddress}-${requestSellTokenAddress}`
          newOrderBook[key] = goodOrders
        })
        await Promise.all(promise1)
      })
      await Promise.all(promise0)
    } catch (err: any) {
      console.error(`Error fetching token price: ${err}`)
      setTokensChanged(false)
      return
    }
    setOrderBook(newOrderBook)
    setTokensChanged(false)
  }

  function selectSellToken(newTokenAddress: string) {
    const newTokenInfo = getTokenInfo(newTokenAddress)
    if (!newTokenInfo) return
    if (sellTokenInfo && newTokenInfo.address === sellTokenInfo.address) return

    if (buyTokenInfo) {
      if (newTokenAddress === buyTokenInfo.address) {
        switchTokens()
      } else {
        setSellToken(newTokenAddress)
        setSellInput(sellInput)
      }
    } else {
      setTokensChanged(true)
      // setSellInput("")
      setSellToken(newTokenAddress)
    }
  }

  function selectBuyToken(newTokenAddress: string) {
    const newTokenInfo = getTokenInfo(newTokenAddress)
    if (!newTokenInfo) return
    if (buyTokenInfo && newTokenInfo.address === buyTokenInfo.address) return
    console.log("Selecting new buy token:", newTokenInfo)
    if (sellTokenInfo) {
      console.log("Current sell token:", sellTokenInfo)
      if (newTokenAddress === sellTokenInfo.address) {
        console.log("They're the same, so switching them.")
        switchTokens()
      } else {
        setBuyToken(newTokenAddress)
        setBuyInput(buyInput)
      }
    } else {
      setTokensChanged(true)
      setBuyToken(newTokenAddress)
    }
  }

  const switchTokens = () => {
    setTokensChanged(true)
    userInputSide === "sell" ? setUserInputSide("buy") : setUserInputSide("sell")
    if (sellTokenInfo && !buyTokenInfo) {
      setBuyToken(sellTokenInfo.address)
      setSellToken(null)
    } else if (buyTokenInfo && !sellTokenInfo) {
      setSellToken(buyTokenInfo.address)
      setBuyToken(null)
    } else if (buyTokenInfo && sellTokenInfo) {
      setSellToken(buyTokenInfo.address)
      setBuyToken(sellTokenInfo.address)
    }
    setBuyInput(sellInput)
    setSellInput(buyInput)
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
        quoteOrderRoutingArray,
        swapPrice,
        estimatedGasFee,
        sellAmount,
        buyAmount,
        sellInput,
        buyInput,
        userInputSide,

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

        selectSellToken,
        selectBuyToken,

        tokensChanged,

        swapRoute,
      }}
    >
      {children}
    </SwapContext.Provider>
  )
}

export default SwapProvider

import React, { useContext, createContext, useEffect, useState, useMemo } from "react"
import { ethers } from "ethers"

import erc20Abi from "../data/abis/erc20.json"

import { WalletContext } from "./WalletContext"

const _defaultBuyToken = (): ZZTokenInfo => {
  return {
    address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    symbol: "USDT",
    decimals: 6,
    name: "Tether USD",
  }
}

const _defaultSellToken = (): ZZTokenInfo => {
  return {
    address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    symbol: "WETH",
    decimals: 18,
    name: "Wrapped Ether",
  }
}

interface Props {
  children: React.ReactNode
}

type ZZMarketInfo = {
  buyToken: string
  sellToken: string
  verified: boolean
}

type EIP712DomainInfo = {
  name: string
  version: string
  chainId: string
  verifyingContract: string
}

type EIP712TypeInfo = {
  Order: { name: string; type: string }[]
}

type ZZInfoMsg = {
  markets: ZZMarketInfo[]
  verifiedTokens: ZZTokenInfo[]
  exchange: {
    exchangeAddress: string
    makerVolumeFee: number
    takerVolumeFee: number
    domain: EIP712DomainInfo
    types: EIP712TypeInfo
  }
}

export type ZZTokenInfo = {
  address: string
  symbol: string
  decimals: number
  name: string
}

export type TokenBalanceObject = Record<string, { value: ethers.BigNumber; valueReadable: number } | undefined>
export type TokenAllowanceObject = Record<string, ethers.BigNumber | undefined>
export type TokenPriceObject = Record<string, number | undefined>

export type ExchangeContextType = {
  sellTokenInfo: ZZTokenInfo | null
  buyTokenInfo: ZZTokenInfo | null
  exchangeAddress: string
  balances: TokenBalanceObject
  allowances: TokenAllowanceObject
  makerFee: number
  takerFee: number
  domainInfo: EIP712DomainInfo | null
  typeInfo: EIP712TypeInfo | null
  tokenInfos: ZZTokenInfo[]
  tokenPricesUSD: TokenPriceObject
  markets: string[]

  updateBalances: (tokens: string[]) => void
  updateAllowances: (tokens: string[]) => void

  getTokens: () => string[]
  getTokenInfo: (token: string) => ZZTokenInfo | null

  setBuyToken: (token: string | null) => void
  setSellToken: (token: string | null) => void
}

export const ExchangeContext = createContext<ExchangeContextType>({
  sellTokenInfo: _defaultSellToken(),
  buyTokenInfo: _defaultBuyToken(),
  exchangeAddress: "",
  balances: {},
  allowances: {},
  makerFee: 0,
  takerFee: 0,
  domainInfo: null,
  typeInfo: null,
  tokenInfos: [],
  tokenPricesUSD: {},
  markets: [],

  updateBalances: async (tokens: string[] | null) => { },
  updateAllowances: async (tokens: string[] | null) => { },

  getTokens: () => [],
  getTokenInfo: (token: string) => null,

  setBuyToken: (token: string | null) => { },
  setSellToken: (token: string | null) => { },
})

function ExchangeProvider({ children }: Props) {
  const [markets, setMarkets] = useState<string[]>([])
  const [tokenInfos, setTokenInfos] = useState<ZZTokenInfo[]>([])
  const [makerFee, setMakerFee] = useState<number>(0)
  const [takerFee, setTakerFee] = useState<number>(0)
  const [sellTokenInfo, setSellTokenInfo] = useState<ZZTokenInfo | null>(_defaultSellToken())
  const [buyTokenInfo, setBuyTokenInfo] = useState<ZZTokenInfo | null>(_defaultBuyToken())
  const [exchangeAddress, setExchangeAddress] = useState<string>("")
  const [domainInfo, setDomainInfo] = useState<EIP712DomainInfo | null>(null)
  const [typeInfo, setTypeInfo] = useState<EIP712TypeInfo | null>(null)
  const [balances, setBalances] = useState<TokenBalanceObject>({})
  const [allowances, setAllowances] = useState<TokenAllowanceObject>({})
  const [tokenPricesUSD, setTokenPricesUSD] = useState<TokenPriceObject>({})

  const { userAddress, network, ethersProvider, updateWalletBalance } = useContext(WalletContext)

  const usdcPriceSource: ethers.Contract | null = useMemo(() => {
    if (network && network.offChainOracle && ethersProvider) {
      return new ethers.Contract(
        network.offChainOracle,
        [
          {
            inputs: [
              { internalType: "contract IERC20", name: "srcToken", type: "address" },
              { internalType: "contract IERC20", name: "dstToken", type: "address" },
              { internalType: "bool", name: "useWrappers", type: "bool" },
            ],
            name: "getRate",
            outputs: [{ internalType: "uint256", name: "weightedRate", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        ethersProvider
      )
    }
    return null
  }, [network, ethersProvider])

  useEffect(() => {
    fetchMarketsInfo()

    const refreshMarketsInterval = setInterval(() => {
      fetchMarketsInfo()
    }, 2.5 * 60 * 1000)
    return () => clearInterval(refreshMarketsInterval)
  }, [network])

  useEffect(() => {
    _updateAllowance()
    _updateBalances()

    const updateBalancesInterval = setInterval(() => {
      _updateBalances()
    }, 30 * 1000)
    return () => clearInterval(updateBalancesInterval)
  }, [markets, userAddress, network])

  useEffect(() => {
    updateTokenPricesUSD()

    const updateTokenPricesUSDInterval = setInterval(() => {
      updateTokenPricesUSD()
    }, 60 * 1000)
    return () => clearInterval(updateTokenPricesUSDInterval)
  }, [usdcPriceSource, tokenInfos])

  async function fetchMarketsInfo() {
    if (!network) {
      console.warn("fetchMarketsInfo: Missing network")
      return
    }

    let result: ZZInfoMsg
    try {
      const response = await fetch(`${network.backendUrl}/v1/info`)
      if (response.status !== 200) {
        console.error("fetchMarketsInfo: Failed to fetch market info.")
        return
      }

      result = await response.json()
    } catch (err: any) {
      console.error(`fetchMarketsInfo: Error fetching market info: ${err}`)
      return
    }

    const parsedMarkets = [
      `${ethers.constants.AddressZero}-${network.wethContractAddress}`,
      `${network.wethContractAddress}-${ethers.constants.AddressZero}`
    ]

    result.markets.forEach(market => {
      if (!market.verified) return

      const parsedBuyToken = market.buyToken.toLowerCase()
      const parsedSellToken = market.sellToken.toLowerCase()
      parsedMarkets.push(`${parsedBuyToken}-${parsedSellToken}`)

      // add ETH version of market
      if (network.wethContractAddress === parsedBuyToken) {
        parsedMarkets.push(`${ethers.constants.AddressZero}-${parsedSellToken}`)
      } else if (network.wethContractAddress === parsedSellToken) {
        parsedMarkets.push(`${parsedBuyToken}-${ethers.constants.AddressZero}`)
      }
    })

    if (network.wethContractAddress) {
      // add wrap/unwrap
      parsedMarkets.push(`${ethers.constants.AddressZero}-${network.wethContractAddress}`)
      parsedMarkets.push(`${network.wethContractAddress}-${ethers.constants.AddressZero}`)
    }
    setMarkets(parsedMarkets)

    const parsedTokenInfos = result.verifiedTokens.map(token => {
      token.address = token.address.toLowerCase()
      return token
    })
    parsedTokenInfos.push(network.nativeCurrency)
    setTokenInfos(parsedTokenInfos)
    setExchangeAddress(result.exchange.exchangeAddress)
    setMakerFee(result.exchange.makerVolumeFee)
    setTakerFee(result.exchange.takerVolumeFee)
    setDomainInfo(result.exchange.domain)
    setTypeInfo(result.exchange.types)
  }

  async function updateTokenPricesUSD() {
    if (!network) {
      console.warn("updateTokenPricesUSD: Missing network")
      return
    }
    if (!usdcPriceSource) {
      console.warn("updateTokenPricesUSD: Missing usdcPriceSource")
      return
    }
    const getPriceUSD = async (tokenAddress: string, decimals: number): Promise<number> => {
      if (!network.usdToken || tokenAddress.toLowerCase() === network.usdToken.toLowerCase()) return 1
      try {
        const weightedRateParsed = await usdcPriceSource.getRate(tokenAddress, network.usdToken, true)
        return Number(ethers.utils.formatUnits(weightedRateParsed, 24 - decimals))
      } catch (err: any) {
        console.error(`Error fetching token price: ${err}`)
        return 0
      }
    }
    const updatedTokenPricesUSD = tokenPricesUSD
    // allwas get native currency
    if (network.wethContractAddress) updatedTokenPricesUSD[ethers.constants.AddressZero] = await getPriceUSD(network.wethContractAddress, 18)

    tokenInfos.forEach(async (token: ZZTokenInfo) => {
      updatedTokenPricesUSD[token.address] = await getPriceUSD(token.address, token.decimals)
    })

    setTokenPricesUSD(updatedTokenPricesUSD)
  }

  const _updateBalances = async (reqTokens: string[] = getTokens()) => {
    updateWalletBalance(reqTokens)
    if (!reqTokens || !ethersProvider || !userAddress || !network) {
      console.warn("_updateBalances: Missing ethers provider, network or userAddress")
      setBalances({})
      return
    }

    const { chainId } = await ethersProvider.getNetwork()
    if (chainId !== network.networkId) {
      console.warn("_updateBalances: Provider on wrong network")
      setBalances({})
      return
    }

    const getBalanceEntry = (value: ethers.BigNumber, decimals: number | undefined | null) => {
      if (!value || value === ethers.constants.Zero || decimals === 0 || !decimals) {
        return {
          value,
          valueReadable: 0,
        }
      }

      const formattedBalance = ethers.utils.formatUnits(value, decimals)
      return {
        value,
        valueReadable: Number(formattedBalance),
      }
    }

    const newBalance: TokenBalanceObject = {}
    const promises = reqTokens.map(async (tokenAddress: string) => {
      let value: ethers.BigNumber = ethers.constants.Zero
      let decimals: number | undefined | null = null
      if (tokenAddress === ethers.constants.AddressZero) {
        value = await ethersProvider.getBalance(userAddress)
        decimals = network?.nativeCurrency.decimals
      } else if (tokenAddress) {
        const contract = new ethers.Contract(tokenAddress, erc20Abi, ethersProvider)
        value = await contract.balanceOf(userAddress)
        decimals = getTokenInfo(tokenAddress)?.decimals
      }
      newBalance[tokenAddress] = getBalanceEntry(value, decimals)
    })
    await Promise.all(promises)

    console.log("_updateBalances - newBalance", newBalance)
    setBalances(newBalance)
  }

  const _updateAllowance = async (reqTokens: string[] = getTokens()) => {
    if (!reqTokens || !ethersProvider || !userAddress || !exchangeAddress || !network) {
      console.warn("_updateAllowance: Missing ethers provider, exchangeAddress, networkor userAddress")
      setAllowances({})
      return
    }

    const { chainId } = await ethersProvider.getNetwork()
    if (chainId !== network.networkId) {
      console.warn("_updateAllowance: Provider on wrong network")
      setBalances({})
      return
    }

    const newAllowances: TokenAllowanceObject = {}
    const promises = reqTokens.map(async (tokenAddress: string) => {
      let value: ethers.BigNumber = ethers.constants.Zero
      if (tokenAddress === ethers.constants.AddressZero) {
        value = ethers.constants.MaxUint256
      } else if (tokenAddress) {
        const contract = new ethers.Contract(tokenAddress, erc20Abi, ethersProvider)
        value = await contract.allowance(userAddress, exchangeAddress)
      }
      newAllowances[tokenAddress] = value
    })
    await Promise.all(promises)

    console.log("_updateAllowance - newAllowances", newAllowances)
    setAllowances(newAllowances)
  }

  const getTokenInfo = (tokenAddress: string) => {
    tokenAddress = tokenAddress.toLowerCase()
    for (let i = 0; i < tokenInfos.length; i++) {
      const tokenInfo = tokenInfos[i]
      if (tokenInfo.address === tokenAddress) {
        return tokenInfo
      }
    }
    return null
  }

  const getTokens = () => {
    return tokenInfos.map(tokeninfo => tokeninfo.address)
  }

  const setBuyToken = (tokenAddress: string | null) => {
    if (!tokenAddress) {
      setBuyTokenInfo(null)
      return
    }
    const newBuyTokenInfo = getTokenInfo(tokenAddress)
    if (!newBuyTokenInfo) {
      console.warn(`setBuyToken: no tokenInfo for ${tokenAddress}`)
    } else {
      setBuyTokenInfo(newBuyTokenInfo)
    }
  }

  const setSellToken = (tokenAddress: string | null) => {
    if (!tokenAddress) {
      setSellTokenInfo(null)
      return
    }
    const newSellTokenInfo = getTokenInfo(tokenAddress)
    if (!newSellTokenInfo) {
      console.warn(`setSellToken: no tokenInfo for ${tokenAddress}`)
    } else {
      setSellTokenInfo(newSellTokenInfo)
    }
  }

  return (
    <ExchangeContext.Provider
      value={{
        buyTokenInfo: buyTokenInfo,
        sellTokenInfo: sellTokenInfo,
        exchangeAddress: exchangeAddress,
        balances: balances,
        allowances: allowances,
        makerFee: makerFee,
        takerFee: takerFee,
        domainInfo: domainInfo,
        typeInfo: typeInfo,
        tokenInfos: tokenInfos,
        tokenPricesUSD: tokenPricesUSD,
        markets: markets,

        updateBalances: _updateBalances,
        updateAllowances: _updateAllowance,

        getTokens: getTokens,
        getTokenInfo: getTokenInfo,

        setBuyToken: setBuyToken,
        setSellToken: setSellToken,
      }}
    >
      {children}
    </ExchangeContext.Provider>
  )
}

export default ExchangeProvider

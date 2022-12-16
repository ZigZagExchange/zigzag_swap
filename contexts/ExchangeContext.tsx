import React, { useContext, createContext, useEffect, useState } from "react"
import { ethers } from "ethers"

import erc20Abi from "../data/abis/erc20.json"

import { WalletContext } from "./WalletContext"

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

export type TokenBalanceObject = {
  [key: string]: {
    value: ethers.BigNumber
    valueReadable: number
  }
}

export type TokenAllowanceObject = {
  [key: string]: ethers.BigNumber
}

export type TokenPriceObject = {
  [key: string]: number
}

export type ExchangeContextType = {
  buyTokenInfo: ZZTokenInfo | null
  sellTokenInfo: ZZTokenInfo | null
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

  setBuyToken: (token: string) => void
  setSellToken: (token: string) => void
}

export const ExchangeContext = createContext<ExchangeContextType>({
  buyTokenInfo: null,
  sellTokenInfo: null,
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

  updateBalances: async (tokens: string[] | null) => {},
  updateAllowances: async (tokens: string[] | null) => {},

  getTokens: () => [],
  getTokenInfo: (token: string) => null,

  setBuyToken: (token: string) => {},
  setSellToken: (token: string) => {},
})

function ExchangeProvider({ children }: Props) {
  const [markets, setMarkets] = useState<string[]>([])
  const [tokenInfos, setTokenInfos] = useState<ZZTokenInfo[]>([])
  const [makerFee, setMakerFee] = useState<number>(0)
  const [takerFee, setTakerFee] = useState<number>(0)
  const [buyTokenInfo, setBuyTokenInfo] = useState<ZZTokenInfo | null>(null)
  const [sellTokenInfo, setSellTokenInfo] = useState<ZZTokenInfo | null>(null)
  const [exchangeAddress, setExchangeAddress] = useState<string>("")
  const [domainInfo, setDomainInfo] = useState<EIP712DomainInfo | null>(null)
  const [typeInfo, setTypeInfo] = useState<EIP712TypeInfo | null>(null)
  const [balances, setBalances] = useState<TokenBalanceObject>({})
  const [allowances, setAllowances] = useState<TokenAllowanceObject>({})
  const [tokenPricesUSD, setTokenPricesUSD] = useState<TokenPriceObject>({})

  const { address, network, ethersProvider } = useContext(WalletContext)

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
  }, [markets, address, network])

  useEffect(() => {
    updateTokenPricesUSD()

    const updateTokenPricesUSDInterval = setInterval(() => {
      updateTokenPricesUSD()
    }, 60 * 1000)
    return () => clearInterval(updateTokenPricesUSDInterval)
  }, [tokenInfos])

  async function fetchMarketsInfo() {
    if (!network) {
      console.warn("fetchMarketsInfo: network is null")
      return
    }

    const response = await fetch(`${network.backendUrl}/v1/info`)
    if (response.status !== 200) {
      console.error("Failed to fetch market info.")
      return
    }

    const result: ZZInfoMsg = await response.json()

    console.log("result", result)
    const parsedmarkets = result.markets
      .filter(m => m.verified)
      .map(m => `${m.buyToken.toLowerCase()}-${m.sellToken.toLowerCase() }`)
    setMarkets(parsedmarkets)

    const parsedTokenInfos = result.verifiedTokens.map(token => {
      token.address = token.address.toLowerCase()

      return token
    })
    setTokenInfos(parsedTokenInfos)
    setExchangeAddress(result.exchange.exchangeAddress)
    setMakerFee(result.exchange.makerVolumeFee)
    setTakerFee(result.exchange.takerVolumeFee)
    setDomainInfo(result.exchange.domain)
    setTypeInfo(result.exchange.types)
  }

  async function updateTokenPricesUSD() {
    if (!network) return

    const getPriceUSD = async (symbol: string) => {
      const response = await fetch(`https://api.coincap.io/v2/assets?search=${symbol}`)
      if (response.status !== 200) {
        console.error(`Failed to fetch token price for ${symbol}.`)
        return
      }

      const result: any = await response.json()
      const priceUSD = result.data?.[0]?.priceUsd ? result.data[0].priceUsd : 0

      if (!priceUSD) {
        console.warn(`Price for ${symbol} is zero`)
      }
      return priceUSD
    }
    // reuse old token price infos in case the API is not reachable for short periods
    const updatedTokenPricesUSD = tokenPricesUSD
    // allwas get native currency
    updatedTokenPricesUSD[ethers.constants.AddressZero] = await getPriceUSD(network.nativeCurrency.symbol)
    tokenInfos.forEach(async (token: ZZTokenInfo) => {
      updatedTokenPricesUSD[token.address] = await getPriceUSD(token.symbol)
    })

    setTokenPricesUSD(updatedTokenPricesUSD)
  }

  const _updateBalances = async (reqTokens: string[] = getTokens()) => {
    if (!network || !reqTokens || !ethersProvider || !address) {
      console.warn("_updateBalances: Missing ethers provider, address or network")
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
          valueReadable: 0
        }
      }

      const formattedBalance = ethers.utils.formatUnits(value, decimals)
      return {
        value,
        valueReadable: Number(formattedBalance)
      }
    }

    const newBalance: TokenBalanceObject = {}
    const promises = reqTokens.map(async (tokenAddress: string) => {
      let value: ethers.BigNumber = ethers.constants.Zero
      let decimals: number | undefined | null = null
      if (tokenAddress === ethers.constants.AddressZero) {
        console.log("Getting balance of native currency", tokenAddress)
        value = await ethersProvider.getBalance(address)
        decimals = network?.nativeCurrency.decimals
      } else if (tokenAddress) {
        console.log("Getting balance of currency at", tokenAddress)
        const contract = new ethers.Contract(tokenAddress, erc20Abi, ethersProvider)
        value = await contract.balanceOf(address)
        decimals = getTokenInfo(tokenAddress)?.decimals
      }
      newBalance[tokenAddress] = getBalanceEntry(value, decimals)
    })
    await Promise.all(promises)

    console.log(newBalance)
    setBalances(newBalance)
  }

  const _updateAllowance = async (reqTokens: string[] = getTokens()) => {
    if (!network || !reqTokens || !ethersProvider || !address || !exchangeAddress) {
      console.warn("_updateAllowance: Missing ethers provider, exchangeAddress, network or address")
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
        console.log("Getting allowance of currency at", tokenAddress)
        const contract = new ethers.Contract(tokenAddress, erc20Abi, ethersProvider)
        value = await contract.allowance(address, exchangeAddress)
      }
      newAllowances[tokenAddress] = value
    })
    await Promise.all(promises)

    console.log(newAllowances)
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

  const setBuyToken = (tokenAddress: string) => {
    setBuyTokenInfo(getTokenInfo(tokenAddress))
  }

  const setSellToken = (tokenAddress: string) => {
    setSellTokenInfo(getTokenInfo(tokenAddress))
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

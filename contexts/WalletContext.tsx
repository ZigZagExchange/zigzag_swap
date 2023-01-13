import React, { createContext, useEffect, useState } from "react"

import { ethers } from "ethers"

import { Resolution } from "@unstoppabledomains/resolution"
import Onboard, { WalletState } from "../node_modules/@web3-onboard/core/dist"
import injectedModule from "@web3-onboard/injected-wallets"
import walletConnectModule from "@web3-onboard/walletconnect/dist"
import coinbaseWalletModule from "@web3-onboard/coinbase"
import ledgerModule from "@web3-onboard/ledger"
import mewWallet from "@web3-onboard/mew-wallet"
import tallyHoWalletModule from "@web3-onboard/tallyho"
import logo from "../public/img/zz.svg"

import { NETWORKS, isValidNetwork, NetworkType, NETWORK } from "../data/networks"

interface Props {
  children: React.ReactNode
}

export type WalletContextType = {
  username: string | null
  signer: ethers.Signer | null
  userAddress: string | null
  ethersProvider: ethers.providers.BaseProvider
  network: NetworkType | null
  isLoading: boolean

  connect: () => void
  disconnect: () => void
  switchNetwork: (network: number) => Promise<boolean>
  updateWalletBalance: (tokenAddressList: string[]) => void
}

export const WalletContext = createContext<WalletContextType>({
  username: null,
  signer: null,
  userAddress: null,
  ethersProvider: _getDefaultProvider(),
  network: _getDefaultNetwork(),
  isLoading: false,

  connect: () => { },
  disconnect: () => { },
  switchNetwork: async (network: number) => {
    return false
  },
  updateWalletBalance: (tokenAddressList: string[]) => { },
})

const wallets = [
  injectedModule(),
  walletConnectModule(),
  coinbaseWalletModule({ darkMode: true }),
  ledgerModule(),
  mewWallet(),
  tallyHoWalletModule(),
]

const chains = Object.keys(NETWORKS).map((key: string) => {
  const network = NETWORKS[Number(key)]
  return {
    id: "0x" + network.networkId.toString(16),
    token: network.nativeCurrency.symbol,
    label: network.name,
    rpcUrl: network.rpcUrl,
  }
})

const onboard = Onboard({
  wallets,
  chains,
  appMetadata: {
    name: "ZigZag Swap",
    icon: logo.src,
    logo: logo.src,
    description: "ZigZag Swap swap interface",
    recommendedInjectedWallets: [{ name: "MetaMask", url: "https://metamask.io" }],
  },
  accountCenter: {
    desktop: {
      enabled: false,
    },
    mobile: {
      enabled: false,
    },
  },
})

function WalletProvider({ children }: Props) {
  const [username, setUserName] = useState<string | null>(null)
  const [network, setNetwork] = useState<NetworkType | null>(_getDefaultNetwork())
  const [ethersProvider, setEthersProvider] = useState<ethers.providers.BaseProvider>(_getDefaultProvider())
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [userAddress, setUserAddress] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const walletsSub = onboard.state.select("wallets")
  walletsSub.subscribe(wallets => {
    // this is used to store the last connected wallet
    const connectedWallets = wallets.map(({ label }) => label)
    if (!connectedWallets) return
    window.localStorage.setItem("connectedWallets", JSON.stringify(connectedWallets))

    // console.log("wallets", wallets)
    const primaryAddress = wallets[0]?.accounts?.[0]?.address
    const primaryChain = parseInt(wallets[0]?.chains?.[0].id, 16)
    if ((primaryAddress && primaryAddress.toLowerCase() !== userAddress) || (primaryChain && network && primaryChain !== network.networkId)) {
      updateWallet(wallets[0])
    }
  })

  useEffect(() => {
    const previouslyConnectedWalletsString = window.localStorage.getItem("connectedWallets")
    if (!previouslyConnectedWalletsString) return

    // JSON.parse()[0] => previously primary wallet
    const lable = previouslyConnectedWalletsString ? JSON.parse(previouslyConnectedWalletsString)[0] : null

    if (lable !== null && lable !== undefined) connectWallet(lable)
  }, [])

  const connectWallet = async (lable?: string) => {
    console.log("start connectWallet")
    try {
      setIsLoading(true)
      let wallets
      if (lable !== null && lable !== undefined) {
        wallets = await onboard.connectWallet({ autoSelect: { label: lable, disableModals: true } })
      } else {
        wallets = await onboard.connectWallet()
      }
      if (!wallets) throw new Error("No connected wallet found")
      updateWallet(wallets[0])
      setIsLoading(false)
    } catch (error: any) {
      console.error(error)
    }
  }

  useEffect(() => {
    const fetchName = async (address: string) => {
      const povider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/6a61248b8b314845ab82371de83ea99f")
      const name = await povider.lookupAddress(address)
      if (name) {
        setUserName(name)
        return
      }
      const resolution = new Resolution()
      const result = await resolution.reverse(address)
      if (result) {
        setUserName(result)
      }
    }
    if (!userAddress) return
    fetchName(userAddress)
  }, [userAddress])

  const updateWallet = (wallet: WalletState) => {
    const { accounts, chains, provider } = wallet
    setUserAddress(accounts[0].address.toLowerCase())

    const network = parseInt(chains[0].id, 16)
    setNetwork(NETWORKS[network])
    const ethersProvider = new ethers.providers.Web3Provider(provider, "any")
    if (ethersProvider) setEthersProvider(ethersProvider)

    const signer = ethersProvider?.getSigner()
    setSigner(signer)
  }

  const _switchNetwork = async (_networkId: number): Promise<boolean> => {
    const [primaryWallet] = onboard.state.get().wallets
    if (!isValidNetwork(_networkId) || !primaryWallet) return false

    const chainId = "0x" + _networkId.toString(16)
    const success = await onboard.setChain({ chainId })
    if (success) setNetwork(NETWORKS[_networkId])
    return success
  }

  const disconnectWallet = async () => {
    const [primaryWallet] = onboard.state.get().wallets
    if (!primaryWallet) return
    await onboard.disconnectWallet({ label: primaryWallet.label })
    setUserAddress(null)
    setUserName(null)
    setNetwork(_getDefaultNetwork())
    setEthersProvider(_getDefaultProvider())
  }

  const updateWalletBalance = (tokenAddressList: string[]) => {
    if (tokenAddressList.length > 0) {
      onboard.state.actions.updateBalances(tokenAddressList)
    } else {
      onboard.state.actions.updateBalances()
    }
  }

  return (
    <WalletContext.Provider
      value={{
        username: username,
        signer: signer,
        userAddress: userAddress,
        ethersProvider: ethersProvider,
        network: network,
        isLoading: isLoading,

        connect: connectWallet,
        disconnect: disconnectWallet,
        switchNetwork: _switchNetwork,
        updateWalletBalance: updateWalletBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export default WalletProvider

function _getDefaultNetwork(): NetworkType {
  return NETWORKS[42161]
}

function _getDefaultProvider(): ethers.providers.BaseProvider {
  const network = _getDefaultNetwork()
  return new ethers.providers.JsonRpcProvider(network.rpcUrl)
}

import React, { createContext, useEffect, useState } from "react"

import { ethers } from "ethers"

import Onboard, { WalletState } from "../node_modules/@web3-onboard/core/dist"
import injectedModule from "@web3-onboard/injected-wallets"
import walletConnectModule from "@web3-onboard/walletconnect/dist"
import coinbaseWalletModule from "@web3-onboard/coinbase"
import ledgerModule from "@web3-onboard/ledger"
import mewWallet from "@web3-onboard/mew-wallet"
import tallyHoWalletModule from "@web3-onboard/tallyho"

import { NETWORKS, isValidNetwork, NetworkType, NETWORK } from "../data/networks"

interface Props {
  children: React.ReactNode
}

export type WalletContextType = {
  username: string | null
  signer: ethers.Signer | null
  userAddress: string | null
  ethersProvider: ethers.providers.Web3Provider | null
  network: NetworkType | null
  isLoading: boolean

  connect: () => void
  disconnect: () => void
  switchNetwork: (network: number) => Promise<boolean>
}

export const WalletContext = createContext<WalletContextType>({
  username: null,
  signer: null,
  userAddress: null,
  ethersProvider: null,
  network: _getDefaultNetwork(),
  isLoading: false,

  connect: () => {},
  disconnect: () => {},
  switchNetwork: async (network: number) => {
    return false
  },
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
    icon: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
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
  const [username, setUsername] = useState<string | null>(null)
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [userAddress, setUserAddress] = useState<string | null>(null)
  const [network, setNetwork] = useState<NetworkType | null>(_getDefaultNetwork())
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

  const updateWallet = (wallet: WalletState) => {
    const { accounts, chains, provider } = wallet
    setUserAddress(accounts[0].address.toLowerCase())
    // console.log(accounts[0])
    if (accounts[0].ens?.name) setUsername(accounts[0].ens?.name)

    const network = parseInt(chains[0].id, 16)
    setNetwork(NETWORKS[network])
    const ethersProvider = new ethers.providers.Web3Provider(provider, "any")
    if (ethersProvider) setProvider(ethersProvider)

    const signer = ethersProvider?.getSigner()
    if (signer) setSigner(signer)
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
    setNetwork(_getDefaultNetwork())
    setProvider(null)
  }

  return (
    <WalletContext.Provider
      value={{
        username: username,
        signer: signer,
        userAddress: userAddress,
        ethersProvider: provider,
        network: network,
        isLoading: isLoading,

        connect: connectWallet,
        disconnect: disconnectWallet,
        switchNetwork: _switchNetwork,
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
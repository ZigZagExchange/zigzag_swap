import { useRef, useContext } from "react"
import styles from "./Modal.module.css"
import TokenListEntry from "./tokenListEntry/TokenListEntry"

import { ExchangeContext } from "../../../contexts/ExchangeContext"
import { ethers } from "ethers"

interface Props {
  selectedModal: "buy" | "sell" | null
  onTokenClick: (tokenAddress: string) => void
  isOpen: boolean
  close: () => void
}

export default function Modal({ selectedModal, onTokenClick, isOpen, close }: Props) {
  const { balances, getTokens, getMarkets, getTokenInfo, buyTokenInfo, sellTokenInfo } = useContext(ExchangeContext)

  const selectedToken = selectedModal === "buy" ? sellTokenInfo?.address : buyTokenInfo?.address

  const container_ref = useRef<HTMLDivElement>(null)

  const tokens: string[] = []
  if (selectedModal === "sell") {
    const possibleTokens = getTokens()
    for (let i = 0; i < possibleTokens.length; i++) {
      const tokenAddress = possibleTokens[i]
      if (
        (balances[tokenAddress].value !== ethers.constants.Zero) && 
        (tokenAddress !== buyTokenInfo?.address)
      ) tokens.push(tokenAddress)
    }
  } else if (selectedModal === "buy") {
    const markets = getMarkets()
    console.log("markets", markets)
    console.log("selectedToken", selectedToken)
    for (let i = 0; i < markets.length; i++) {
      const [tokenA, tokenB] = markets[i].split('-')
      if (selectedToken === tokenA && sellTokenInfo?.address !== tokenB) tokens.push(tokenB)
      if (selectedToken === tokenB && sellTokenInfo?.address !== tokenA) tokens.push(tokenA)
    }
    console.log("tokens", tokens)
  }

  const tokenList: any = []
  for (let i = 0; i < tokens.length; i++) {
    const tokenAddress = tokens[i]
    const tokenInfo = getTokenInfo(tokenAddress)
    if (!tokenInfo) continue

    tokenList.push((
      <TokenListEntry
        symbol={tokenInfo.symbol}
        selected={tokenAddress === selectedToken}
        balance={balances[tokenAddress] ? balances[tokenAddress].valueReadable : "0.0"}
        usdValue={balances[tokenAddress] ? balances[tokenAddress].valueUSD : "0.0"}
        onClick={() => onTokenClick(tokenAddress)} />
    ))
  }

  return (
    <div
      className={`${styles.container} ${!isOpen ? styles.hidden : ""}`}
      onClick={e => (e.target === container_ref.current ? close() : null)}
      ref={container_ref}
    >
      <div className={styles.modal}>
        <div className={styles.title}>Select a token to swap</div>
        <hr />
        <input className={styles.search_input} type="text" placeholder="Search..." />
        <div className={styles.token_list_container}>{tokenList}</div>
      </div>
    </div>
  )
}

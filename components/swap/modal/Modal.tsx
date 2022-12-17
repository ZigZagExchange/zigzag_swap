import { useRef, useContext, useState, useMemo } from "react"
import styles from "./Modal.module.css"
import TokenListEntry from "./tokenListEntry/TokenListEntry"

import { prettyBalance, prettyBalanceUSD } from "../../../utils/utils"
import { ExchangeContext } from "../../../contexts/ExchangeContext"

interface Props {
  selectedModal: "buy" | "sell" | null
  onTokenClick: (tokenAddress: string) => void
  isOpen: boolean
  close: () => void
}

type TokenEntry = { 
  tokenAddress: string,
  balance: number,
  value: number
}

export default function Modal({ selectedModal, onTokenClick, isOpen, close }: Props) {
  const { balances, markets, buyTokenInfo, sellTokenInfo, tokenPricesUSD, getTokens, getTokenInfo } = useContext(ExchangeContext)
  const [query, setQuery] = useState<string>("")

  const selectedToken = selectedModal === "sell" ? sellTokenInfo?.address : buyTokenInfo?.address

  const container_ref = useRef<HTMLDivElement>(null)

  const tokenEntrysList: TokenEntry[] = useMemo(() => {
    const newTokenEntrysList: TokenEntry[] = []
    
    if (selectedModal === "sell") {
      const possibleTokens = getTokens()
      for (let i = 0; i < possibleTokens.length; i++) {
        const tokenAddress = possibleTokens[i]
        if (tokenAddress === selectedToken) continue

        const balance = balances[tokenAddress] ? balances[tokenAddress].valueReadable : 0
        const value = balance && tokenPricesUSD[tokenAddress] ? balance * tokenPricesUSD[tokenAddress] : 0
        newTokenEntrysList.push({ tokenAddress, balance, value })
      }
    } else if (selectedModal === "buy") {
      const tokens: string[] = []
      for (let i = 0; i < markets.length; i++) {
        const [tokenA, tokenB] = markets[i].split("-")
        if (sellTokenInfo?.address !== tokenA && !tokens.includes(tokenA)) tokens.push(tokenA)
        if (sellTokenInfo?.address !== tokenB && !tokens.includes(tokenB)) tokens.push(tokenB)
      }
      tokens.forEach((tokenAddress: string) => {
        const balance = balances[tokenAddress] ? balances[tokenAddress].valueReadable : 0
        const value = balance && tokenPricesUSD[tokenAddress] ? balance * tokenPricesUSD[tokenAddress] : 0
        newTokenEntrysList.push({ tokenAddress, balance, value })
      })
    }
    return newTokenEntrysList
  }, [balances, tokenPricesUSD, getTokens, selectedModal, selectedToken, markets, sellTokenInfo ])

  const sortedTokenEntrys: TokenEntry[] = useMemo(() => {
    const tokensWithValue: TokenEntry[] = tokenEntrysList.filter(t => t.value !== 0)
      .sort(function (a: TokenEntry, b: TokenEntry) {
        return b.value - a.value
      });
    const tokensWithBalance: TokenEntry[] = tokenEntrysList.filter(t => t.value === 0 && t.balance !== 0)
      .sort(function (a: TokenEntry, b: TokenEntry) {
        return b.balance - a.balance
      });
    const otherTokens: TokenEntry[] = tokenEntrysList.filter(t => t.balance === 0 && t.value === 0)
    
    return tokensWithValue.concat(tokensWithBalance).concat(otherTokens)
  }, [tokenEntrysList])

  const tokenList: JSX.Element[] = useMemo(
    () =>
      sortedTokenEntrys.reduce((currentList, { tokenAddress, balance, value }) => {
        const tokenInfo = getTokenInfo(tokenAddress)
        if (tokenInfo === null) return currentList
        if (
          !tokenInfo.symbol.toLocaleLowerCase().includes(query.toLowerCase()) &&
          !tokenInfo.name.toLocaleLowerCase().includes(query.toLowerCase()) &&
          !tokenAddress.includes(query.toLowerCase())          
        )
          return currentList
        return [
          ...currentList,
          <TokenListEntry
            key={tokenAddress}
            symbol={tokenInfo.symbol}
            name={tokenInfo.name}
            selected={tokenAddress === selectedToken}
            balance={balance ? prettyBalance(balance) : "0.0"}
            usdValue={value ? prettyBalanceUSD(value) : "0.0"}
            onClick={() => onTokenClick(tokenAddress)}
          />,
        ]
      }, [] as JSX.Element[]),
    [sortedTokenEntrys, query, selectedToken]
  )

  function close_modal() {
    setQuery("")
    close()
  }

  return (
    <div
      className={`${styles.container} ${!isOpen ? styles.hidden : ""}`}
      onClick={e => (e.target === container_ref.current ? close_modal() : null)}
      ref={container_ref}
    >
      <div className={styles.modal}>
        <div className={styles.title}>Select a token to swap {selectedModal === "sell" ? "from" : "to"} </div>
        <hr />
        <input
          className={styles.search_input}
          type="text"
          placeholder="Search..."
          value={query}
          onChange={p => setQuery(p.target.value)}
          spellCheck="false"
        />
        <div className={styles.token_list_container}>{tokenList}</div>
      </div>
    </div>
  )
}

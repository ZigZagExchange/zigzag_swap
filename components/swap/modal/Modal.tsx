import { useRef, useContext, useState, useMemo, useEffect } from "react"
import styles from "./Modal.module.css"
import TokenListEntry from "./tokenListEntry/TokenListEntry"

import { prettyBalance, prettyBalanceUSD } from "../../../utils/utils"
import { ExchangeContext } from "../../../contexts/ExchangeContext"
import useTranslation from "next-translate/useTranslation"

interface Props {
  selectedModal: "buy" | "sell" | null
  onTokenClick: (tokenAddress: string) => void
  isOpen: boolean
  close: () => void
}

type TokenEntry = {
  tokenAddress: string
  balance: number
  value: number
}

export default function Modal({ selectedModal, onTokenClick, isOpen, close }: Props) {
  const { balances, markets, buyTokenInfo, sellTokenInfo, tokenPricesUSD, getTokens, getTokenInfo, setBuyToken } = useContext(ExchangeContext)
  const [query, setQuery] = useState<string>("")

  const container_ref = useRef<HTMLDivElement>(null)
  const { t } = useTranslation("swap")

  const selectedToken = selectedModal === "sell" ? sellTokenInfo?.address : buyTokenInfo?.address

  const buyModalTokenEntryList: TokenEntry[] = useMemo(() => {
    const tokens: string[] = [sellTokenInfo?.address]
    for (let i = 0; i < markets.length; i++) {
      const [tokenA, tokenB] = markets[i].split("-")
      if (sellTokenInfo?.address === tokenB && !tokens.includes(tokenA)) tokens.push(tokenA)
      if (sellTokenInfo?.address === tokenA && !tokens.includes(tokenB)) tokens.push(tokenB)
    }

    return tokens.map((tokenAddress: string) => {
      const balance = balances[tokenAddress] ? balances[tokenAddress].valueReadable : 0
      const value = balance && tokenPricesUSD[tokenAddress] ? balance * tokenPricesUSD[tokenAddress] : 0
      return { tokenAddress, balance, value }
    })
  }, [balances, tokenPricesUSD, markets, sellTokenInfo])

  const sellModalTokenEntryList: TokenEntry[] = useMemo(() => {
    const newTokenEntrysList: TokenEntry[] = []
    const possibleTokens = getTokens()
    for (let i = 0; i < possibleTokens.length; i++) {
      const tokenAddress = possibleTokens[i]
      if (tokenAddress === selectedToken) continue

      const balance = balances[tokenAddress] ? balances[tokenAddress].valueReadable : 0
      const value = balance && tokenPricesUSD[tokenAddress] ? balance * tokenPricesUSD[tokenAddress] : 0
      newTokenEntrysList.push({ tokenAddress, balance, value })
    }
    return newTokenEntrysList
  }, [balances, tokenPricesUSD, getTokens, selectedToken])

  const sortedTokenEntrys: TokenEntry[] = useMemo(() => {
    const tokenEntrysList = selectedModal === "buy" ? buyModalTokenEntryList : sellModalTokenEntryList
    const tokensWithValue: TokenEntry[] = tokenEntrysList
      .filter(t => t.value !== 0)
      .sort(function (a: TokenEntry, b: TokenEntry) {
        return b.value - a.value
      })
    const tokensWithBalance: TokenEntry[] = tokenEntrysList
      .filter(t => t.value === 0 && t.balance !== 0)
      .sort(function (a: TokenEntry, b: TokenEntry) {
        return b.balance - a.balance
      })
    const otherTokens: TokenEntry[] = tokenEntrysList.filter(t => t.balance === 0 && t.value === 0)

    return tokensWithValue.concat(tokensWithBalance).concat(otherTokens)
  }, [selectedModal, buyModalTokenEntryList, sellModalTokenEntryList])

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

  useEffect(() => {
    if (buyModalTokenEntryList.length === 0) return

    // check if current buy token in possible options
    const searchList = buyModalTokenEntryList.filter(e => e.tokenAddress === buyTokenInfo?.address)
    if (searchList.length === 0) {
      // selected token not in options -> update
      setBuyToken(buyModalTokenEntryList[0].tokenAddress)
    }
  }, [buyModalTokenEntryList])

  useEffect(() => {
    const close = (e: any) => {
      if (e.key === 'Escape') {
        close_modal()
      }
    }
    if (isOpen) window.addEventListener('keydown', close)    
    return () => window.removeEventListener('keydown', close)
  }, [isOpen])

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
        <div className={styles.title}>
          {t("modal_title", { from_or_to: selectedModal === "sell" ? "from" : "to" })}
          {/* Select a token to swap {selectedModal === "sell" ? "from" : "to"}  */}
        </div>
        <hr />
        <input
          className={styles.search_input}
          type="text"
          placeholder={t("search")}
          value={query}
          onChange={p => setQuery(p.target.value)}
          spellCheck="false"
        />
        <div className={styles.token_list_container}>{tokenList}</div>
      </div>
    </div>
  )
}

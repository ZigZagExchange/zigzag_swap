import { ethers } from "ethers"
import useTranslation from "next-translate/useTranslation"
import { useContext, useEffect, useMemo, useRef, useState } from "react"
import { ExchangeContext } from "../../../../contexts/ExchangeContext"
import { WalletContext } from "../../../../contexts/WalletContext"
import { prettyBalance, prettyBalanceUSD } from "../../../../utils/utils"
import { ModalMode } from "../../modal/Modal"
import TokenListEntry from "./tokenListEntry/TokenListEntry"
import styles from "./TokenSelectModal.module.css"

type TokenEntry = {
  tokenAddress: string
  balance: number
  value: number
}

interface Props {
  selectedModal: ModalMode
  onTokenClick: (tokenAddress: string) => void
  close: () => void
}

export default function TokenSelectModal({ selectedModal, onTokenClick, close }: Props) {
  const { balances, markets, buyTokenInfo, sellTokenInfo, tokenPricesUSD, getTokens, getTokenInfo, setBuyToken } = useContext(ExchangeContext)
  const { network } = useContext(WalletContext)
  const [query, setQuery] = useState<string>("")

  const { t } = useTranslation("swap")

  const selectedToken = selectedModal === "selectSellToken" ? sellTokenInfo?.address : buyTokenInfo?.address

  const buyModalTokenEntryList: TokenEntry[] = useMemo(() => {
    const tokens: string[] = []
    for (let i = 0; i < markets.length; i++) {
      const [tokenA, tokenB] = markets[i].split("-")
      if (sellTokenInfo?.address === tokenB && !tokens.includes(tokenA)) tokens.push(tokenA)
      if (sellTokenInfo?.address === tokenA && !tokens.includes(tokenB)) tokens.push(tokenB)
    }

    if (tokens.length === 0) return []
    // check if current buy token in possible options
    const searchList = tokens.filter(tokenAddress => tokenAddress === buyTokenInfo?.address)
    if (searchList.length === 0) {
      // selected token not in options -> update
      setBuyToken(tokens[0])
    }

    // push sellToken as well
    tokens.push(sellTokenInfo?.address)
    return tokens.map((tokenAddress: string) => {
      const balance = balances[tokenAddress]
      const balanceReadable = balance ? balance.valueReadable : 0
      const tokenPriceUsd = tokenPricesUSD[tokenAddress]
      const value = balance && tokenPriceUsd ? balanceReadable * tokenPriceUsd : 0
      return { tokenAddress, balance: balanceReadable, value }
    })
  }, [balances, tokenPricesUSD, markets, sellTokenInfo])

  const sellModalTokenEntryList: TokenEntry[] = useMemo(() => {
    // if (buyTokenInfo.symbol === "ETH") {
    //   const tokenAddresses = getTokens()
    //   for (let i = 0; i < tokenAddresses.length; i++) {
    //     const tokenAddress = tokenAddresses[i]
    //     const tokenInfo = getTokenInfo(tokenAddress)
    //     if (tokenInfo?.symbol === "WETH") {
    //       const balance = balances[tokenAddress]
    //       const balanceReadable = balance ? balance.valueReadable : 0
    //       const tokenPriceUsd = tokenPricesUSD[tokenAddress]
    //       const value = balance && tokenPriceUsd ? balanceReadable * tokenPriceUsd : 0
    //       return [{ tokenAddress, balance: balanceReadable, value }]
    //     }
    //   }
    // }

    const newTokenEntrysList: TokenEntry[] = []
    const possibleTokens = getTokens()
    for (let i = 0; i < possibleTokens.length; i++) {
      const tokenAddress = possibleTokens[i]

      // Skip native currency
      // if (buyTokenInfo.symbol !== "WETH" && tokenAddress === network?.nativeCurrency.address) continue

      const balance = balances[tokenAddress]
      const balanceReadable = balance ? balance.valueReadable : 0
      const tokenPriceUsd = tokenPricesUSD[tokenAddress]
      const value = balance && tokenPriceUsd ? balanceReadable * tokenPriceUsd : 0
      newTokenEntrysList.push({ tokenAddress, balance: balanceReadable, value })
    }
    return newTokenEntrysList
  }, [balances, tokenPricesUSD, getTokens, selectedToken])

  const sortedTokenEntrys: TokenEntry[] = useMemo(() => {
    const tokenEntrysList = selectedModal === "selectBuyToken" ? buyModalTokenEntryList : sellModalTokenEntryList
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

  function close_modal() {
    setQuery("")
    close()
  }

  return (
    <>
      <div className={styles.title}>{t("modal_title", { from_or_to: selectedModal === "selectSellToken" ? "from" : "to" })}</div>
      <hr className={styles.hr} />
      <input
        className={styles.search_input}
        type="text"
        placeholder={t("search")}
        value={query}
        onChange={p => setQuery(p.target.value)}
        spellCheck="false"
      />
      <div className={styles.token_list_container}>{tokenList}</div>
    </>
  )
}

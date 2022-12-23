import { constants, ethers } from "ethers"
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
  const [query, setQuery] = useState<string>("")

  const { t } = useTranslation("swap")

  const selectedToken = selectedModal === "selectSellToken" ? sellTokenInfo?.address : buyTokenInfo?.address

  const tokenList: TokenEntry[] = []
  if (selectedModal === "selectSellToken") {
    const allTokens = getTokens()
    for (let i = 0; i < allTokens.length; i++) {
      const tokenAddress = allTokens[i]
      const balance = balances[tokenAddress]
      const balanceReadable = balance ? balance.valueReadable : 0
      const tokenPriceUsd = tokenPricesUSD[tokenAddress]
      const value = balance && tokenPriceUsd ? balanceReadable * tokenPriceUsd : 0
      tokenList.push({ tokenAddress, balance: balanceReadable, value })
    }
  } else if (selectedModal === "selectBuyToken") {
    const allTokens = getTokens()
    for (let i = 0; i < allTokens.length; i++) {
      const tokenAddress = allTokens[i]
      const balance = balances[tokenAddress]
      const balanceReadable = balance ? balance.valueReadable : 0
      const tokenPriceUsd = tokenPricesUSD[tokenAddress]
      const value = balance && tokenPriceUsd ? balanceReadable * tokenPriceUsd : 0
      tokenList.push({ tokenAddress, balance: balanceReadable, value })
    }

    // const allTokens: string[] = []
    // for (let i = 0; i < markets.length; i++) {
    //   const [tokenA, tokenB] = markets[i].split("-")
    //   if (sellTokenInfo.address === tokenB && !allTokens.includes(tokenA)) allTokens.push(tokenA)
    //   if (sellTokenInfo.address === tokenA && !allTokens.includes(tokenB)) allTokens.push(tokenB)
    // }

    // for (let i = 0; i < allTokens.length; i++) {
    //   const tokenAddress = allTokens[i]
    //   const balance = balances[tokenAddress]
    //   const balanceReadable = balance ? balance.valueReadable : 0
    //   const tokenPriceUsd = tokenPricesUSD[tokenAddress]
    //   const value = balance && tokenPriceUsd ? balanceReadable * tokenPriceUsd : 0
    //   tokenList.push({ tokenAddress, balance: balanceReadable, value })
    // }
  }

  function sortTokens(tokenList: TokenEntry[]) {
    const tokensWithValue: TokenEntry[] = tokenList.filter(t => t.value !== 0).sort((a: TokenEntry, b: TokenEntry) => b.value - a.value)

    const tokensWithBalance: TokenEntry[] = tokenList
      .filter(t => t.value === 0 && t.balance !== 0)
      .sort((a: TokenEntry, b: TokenEntry) => b.balance - a.balance)

    const otherTokens: TokenEntry[] = tokenList.filter(t => t.balance === 0 && t.value === 0)

    return tokensWithValue.concat(tokensWithBalance).concat(otherTokens)
  }

  const tokenListElements = sortTokens(tokenList).reduce((currentList, { tokenAddress, balance, value }) => {
    const tokenInfo = getTokenInfo(tokenAddress)
    if (tokenInfo === null) return currentList

    const matchesQuery =
      tokenInfo.symbol.toLocaleLowerCase().includes(query.toLowerCase()) ||
      tokenInfo.name.toLocaleLowerCase().includes(query.toLowerCase()) ||
      tokenAddress.includes(query.toLowerCase())

    if (!matchesQuery) return currentList

    const tokenListEntry = (
      <TokenListEntry
        key={tokenAddress}
        symbol={tokenInfo.symbol}
        name={tokenInfo.name}
        selected={tokenAddress === selectedToken}
        balance={balance ? prettyBalance(balance) : "0.0"}
        usdValue={value ? prettyBalanceUSD(value) : "0.0"}
        onClick={() => onTokenClick(tokenAddress)}
      />
    )
    return [...currentList, tokenListEntry]
  }, [] as JSX.Element[])

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
      <div className={styles.token_list_container}>{tokenListElements}</div>
    </>
  )
}

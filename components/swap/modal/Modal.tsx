import { useRef, useContext, useState, useMemo } from "react"
import styles from "./Modal.module.css"
import TokenListEntry from "./tokenListEntry/TokenListEntry"

import { prettyBalance, prettyBalanceUSD } from "../../../utils/utils"
import { ExchangeContext } from "../../../contexts/ExchangeContext"
import { WalletContext } from "../../../contexts/WalletContext"
import { ethers } from "ethers"

interface Props {
  selectedModal: "buy" | "sell" | null
  onTokenClick: (tokenAddress: string) => void
  isOpen: boolean
  close: () => void
}

export default function Modal({ selectedModal, onTokenClick, isOpen, close }: Props) {
  const { userAddress } = useContext(WalletContext)
  const { balances, markets, buyTokenInfo, sellTokenInfo, tokenPricesUSD, getTokens, getTokenInfo } = useContext(ExchangeContext)
  const [query, setQuery] = useState<string>("")

  const selectedToken = selectedModal === "buy" ? sellTokenInfo?.address : buyTokenInfo?.address

  const container_ref = useRef<HTMLDivElement>(null)

  const tokens: string[] = []
  if (selectedModal === "sell") {
    const possibleTokens = getTokens()
    for (let i = 0; i < possibleTokens.length; i++) {
      const tokenAddress = possibleTokens[i]
      if (tokenAddress === buyTokenInfo?.address) continue
      if (userAddress && balances[tokenAddress] && balances[tokenAddress].value !== ethers.constants.Zero) continue

      tokens.push(tokenAddress)        
    }
  } else if (selectedModal === "buy") {
    for (let i = 0; i < markets.length; i++) {
      const [tokenA, tokenB] = markets[i].split("-")
      if (selectedToken === tokenB && sellTokenInfo?.address !== tokenA && !tokens.includes(tokenA)) tokens.push(tokenA)
      if (selectedToken === tokenA && sellTokenInfo?.address !== tokenB && !tokens.includes(tokenB)) tokens.push(tokenB)
    }
  }

  // const tokenList: any = []
  // for (let i = 0; i < tokens.length; i++) {
  //   const tokenAddress = tokens[i]
  //   const tokenInfo = getTokenInfo(tokenAddress)
  //   if (!tokenInfo) continue
  //   tokenList.push(
  //     <TokenListEntry
  //       symbol={tokenInfo.symbol}
  //       name={tokenInfo.name}
  //       selected={tokenAddress === selectedToken}
  //       balance={balances[tokenAddress] ? prettyBalance(balances[tokenAddress].valueReadable) : "0.0"}
  //       onClick={() => onTokenClick(tokenAddress)}
  //     />
  //   )
  // }

  const tokenList: JSX.Element[] = useMemo(
    () =>
      tokens.reduce((currentList, tokenAddress) => {
        const tokenInfo = getTokenInfo(tokenAddress)
        if (tokenInfo === null) return currentList
        if (!tokenInfo.symbol.toLocaleLowerCase().includes(query.toLowerCase()) && !tokenInfo.name.toLocaleLowerCase().includes(query.toLowerCase()))
          return currentList
        return [
          ...currentList,
          <TokenListEntry
            key={tokenAddress}
            symbol={tokenInfo.symbol}
            name={tokenInfo.name}
            selected={tokenAddress === selectedToken}
            balance={balances[tokenAddress] ? prettyBalance(balances[tokenAddress].valueReadable) : "0.0"}
            usdValue={
              balances[tokenAddress] && tokenPricesUSD[tokenAddress] ? prettyBalanceUSD(balances[tokenAddress].valueReadable * tokenPricesUSD[tokenAddress]) : "0.0"
            }
            onClick={() => onTokenClick(tokenAddress)}
          />,
        ]
      }, [] as JSX.Element[]),
    [tokens, query, balances, getTokenInfo]
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

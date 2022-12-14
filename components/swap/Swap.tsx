import { useState, useContext, useEffect } from "react"

import FromInput from "./fromInput/FromInput"
import ToInput from "./toInput/ToInput"

import styles from "./Swap.module.css"
import Modal from "./modal/Modal"
import TransactionSettings from "./transactionSettings/TransactionSettings"

import { ExchangeContext } from "../../contexts/ExchangeContext"
import { WalletContext } from "../../contexts/WalletContext"
import { SwapContext } from "../../contexts/SwapContext"
import { prettyBalance } from "../../utils/utils"

function Swap() {
  const [modal, setModal] = useState<"buy" | "sell" | null>(null)

  const { network } = useContext(WalletContext)
  const { balances, buyTokenInfo, sellTokenInfo, setBuyToken, setSellToken } = useContext(ExchangeContext)
  const { estimatedGasFee, swapPrice } = useContext(SwapContext)

  function switchTokens() {
    if (buyTokenInfo) setSellToken(buyTokenInfo.address)
    if (sellTokenInfo) setBuyToken(sellTokenInfo.address)    
  }

  const sellTokenSymbol = sellTokenInfo?.symbol ? sellTokenInfo?.symbol : "Token"
  const buyTokenSymbol = buyTokenInfo?.symbol ? buyTokenInfo?.symbol : "Token"

  let buyBalanceReadable = "0.0"
  let buyBalanceUSDReadable = "0.0"
  if (buyTokenInfo?.address && balances && balances[buyTokenInfo.address]) {
    buyBalanceReadable = balances[buyTokenInfo.address].valueReadable
    buyBalanceUSDReadable = balances[buyTokenInfo.address].valueUSD
  }

  let sellBalanceReadable = "0.0"
  let sellBalanceUSDReadable = "0.0"
  if (sellTokenInfo?.address && balances && balances[sellTokenInfo.address]) {
    sellBalanceReadable = balances[sellTokenInfo.address].valueReadable
    sellBalanceUSDReadable = balances[sellTokenInfo.address].valueUSD
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Swap</h1>
      <div className={styles.from_to_container}>
        <div className={styles.from_container}>
          <div className={styles.from_header}>
            <div className={styles.from_title}>From</div>
            <div className={styles.from_balance}>
              Balance: {sellBalanceReadable} {sellTokenSymbol}
            </div>
          </div>
          <div className={styles.from_input_container}>
            <FromInput sellTokenSymbol={sellTokenSymbol} openModal={() => setModal("sell")} />
          </div>
          <div className={styles.estimated_value}>{`~$${sellBalanceUSDReadable}`}</div>
        </div>
        <div className={styles.arrow_container}>
          <hr className={styles.hr} />

          <svg className={styles.arrow} viewBox="0 0 490 490" fill="currentColor" onClick={switchTokens}>
            <path
              d="M52.8,311.3c-12.8-12.8-12.8-33.4,0-46.2c6.4-6.4,14.7-9.6,23.1-9.6s16.7,3.2,23.1,9.6l113.4,113.4V32.7
		c0-18,14.6-32.7,32.7-32.7c18,0,32.7,14.6,32.7,32.7v345.8L391,265.1c12.8-12.8,33.4-12.8,46.2,0c12.8,12.8,12.8,33.4,0,46.2
		L268.1,480.4c-6.1,6.1-14.4,9.6-23.1,9.6c-8.7,0-17-3.4-23.1-9.6L52.8,311.3z"
            />
          </svg>

          {/* <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className={styles.arrow}
            //   class="absolute inset-x-0 mx-auto -mt-3.5 w-7 hover:opacity-80 text-white origin-center hover:rotate-180 transition-all duration-300 ease-in-out"
          >
            <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z"></path>
          </svg> */}
        </div>
        <div className={styles.to_container}>
          <div className={styles.to_header}>
            <div className={styles.to_title}>To</div>
            <div className={styles.to_balance}>
              Balance: {buyBalanceReadable} {buyTokenSymbol}
            </div>
          </div>
          <div className={styles.to_input_container}>
            <ToInput buyTokenSymbol={buyTokenSymbol} openModal={() => setModal("buy")} />
          </div>
          <div className={styles.estimated_value}>{`~$${buyBalanceUSDReadable}`}</div>
        </div>
      </div>
      <TransactionSettings 
        buySymbol={buyTokenSymbol}
        sellSymbol={sellTokenSymbol}
        priceBuy={`$${prettyBalance(swapPrice, 4)}`}
        priceSell={`$${swapPrice && Number.isFinite(swapPrice) ? prettyBalance(1 / swapPrice, 4) : prettyBalance(0, 4) }`}
        estimatedGasFee={estimatedGasFee}
        nativeCurrencySymbol={network.nativeCurrency.symbol}
      />
      <button>Swap</button>
      <Modal
        isOpen={modal !== null}
        selectedModal={modal}
        onTokenClick={
          modal === "sell"
            ? (token: string) => {
                setSellToken(token)
                setModal(null)
              }
            : (token: string) => {
                setBuyToken(token)
                setModal(null)
              }
        }
        close={() => setModal(null)}
      />
    </div>
  )
}

export default Swap

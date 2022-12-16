import { useContext } from "react"

import { prettyBalance, prettyBalanceUSD } from "../../../utils/utils"
import styles from "./TransactionSettings.module.css"
import { SwapContext } from "../../../contexts/SwapContext"

interface Props {
  buySymbol: string
  sellSymbol: string
  priceBuy: string
  priceSell: string
  priceBuyUsd: number | undefined
  priceSellUsd: number | undefined
  nativeCurrencyUsd: number
  nativeCurrencySymbol: string
}

function TransactionSettings({
  buySymbol,
  sellSymbol,
  priceBuy,
  priceSell,
  priceBuyUsd,
  priceSellUsd,
  nativeCurrencyUsd,
  nativeCurrencySymbol,
}: Props) {
  const { estimatedGasFee } = useContext(SwapContext)

  let buy_price_element
  if (priceBuyUsd !== undefined) {
    buy_price_element = (
      <div className={styles.buy_price_info}>
        <div>{`${buySymbol} buy price`}</div>
        <div>{`${priceBuy} ${sellSymbol}  ~$${prettyBalanceUSD(priceBuyUsd)}`}</div>
      </div>
    )
  }

  let sell_price_element
  if (priceSellUsd !== undefined) {
    sell_price_element = (
      <div className={styles.sell_price_info}>
        <div>{`${sellSymbol} sell price`}</div>
        <div>{`${priceSell} ${buySymbol}  ~$${prettyBalanceUSD(priceSellUsd)}`}</div>
      </div>
    )
  }

  let gas_fee_element
  if (estimatedGasFee !== undefined) {
    const estimatedGasFeeUsd = Number.isFinite(estimatedGasFee) && nativeCurrencyUsd ? prettyBalanceUSD(estimatedGasFee * nativeCurrencyUsd) : "0.0"
    gas_fee_element = (
      <div className={styles.gas_fee}>
        <div>Gas fee</div>
        <div>{`${prettyBalance(estimatedGasFee, 8)} ${nativeCurrencySymbol}  ~$${estimatedGasFeeUsd}`}</div>
      </div>
    )
  } else {
    gas_fee_element = (
      <div className={styles.gas_fee}>
        <div>Gas fee</div>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>Transaction Settings</div>
      <hr className={styles.hr} />
      {buy_price_element}
      {sell_price_element}
      {gas_fee_element}
    </div>
  )
}

export default TransactionSettings

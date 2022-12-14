import { prettyBalance, prettyBalanceUSD } from "../../../utils/utils"
import styles from "./TransactionSettings.module.css"

interface Props {
  buySymbol: string
  sellSymbol: string
  priceBuy: string
  priceSell: string
  priceBuyUsd: number
  priceSellUsd: number
  estimatedGasFee: number
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
  estimatedGasFee,
  nativeCurrencyUsd,
  nativeCurrencySymbol 
}: Props) {
  const buyPriceEstimate = priceBuyUsd ? prettyBalanceUSD(priceBuyUsd) : "0.0"
  const sellPriceEstimate = priceSellUsd ? prettyBalanceUSD(priceSellUsd) : "0.0"
  const estimatedGasFeeUsd = Number.isFinite(estimatedGasFee) && nativeCurrencyUsd ? prettyBalanceUSD(estimatedGasFee * nativeCurrencyUsd) : "0.0"

  return (
    <div className={styles.container}>
      <div className={styles.title}>Transaction Settings</div>
      <hr className={styles.hr} />
      <div className={styles.buy_price_info}>
        <div>{`${buySymbol} buy price`}</div>
        <div>{`${priceBuy} ${sellSymbol}  ~$${buyPriceEstimate}`}</div>
      </div>

      <div className={styles.sell_price_info}>
        <div>{`${sellSymbol} sell price`}</div>
        <div>{`${priceSell} ${buySymbol}  ~$${sellPriceEstimate}`}</div>
      </div>

      <div className={styles.gas_fee}>
        <div>Gas Fee</div>
        <div>{`${prettyBalance(estimatedGasFee, 4)} ${nativeCurrencySymbol}  ~${estimatedGasFeeUsd}`}</div>
      </div>
    </div>
  )
}

export default TransactionSettings

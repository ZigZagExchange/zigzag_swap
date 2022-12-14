import { prettyBalance } from "../../../utils/utils"
import styles from "./TransactionSettings.module.css"

interface Props {
  buySymbol: string
  sellSymbol: string
  priceBuy: string
  priceSell: string
  estimatedGasFee: number
  nativeCurrencySymbol: string
}

function TransactionSettings({ buySymbol, sellSymbol, priceBuy, priceSell, estimatedGasFee, nativeCurrencySymbol }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.title}>Transaction Settings</div>
      <hr className={styles.hr} />
      <div className={styles.slippage_tolerance}>
        <div>Slippage Tolerance</div>
        <div>1.00%</div>
      </div>

      <div className={styles.buy_price_info}>
        <div>{`${buySymbol} buy price`}</div>
        <div>{`${priceBuy} ${sellSymbol}  ~$0.00`}</div>
      </div>

      <div className={styles.sell_price_info}>
        <div>{`${sellSymbol} sell price`}</div>
        <div>{`${priceSell} ${buySymbol}  ~$0.00`}</div>
      </div>

      <div className={styles.gas_fee}>
        <div>Gas Fee</div>
        <div>{`${prettyBalance(estimatedGasFee, 4)} ${nativeCurrencySymbol}  ~0.08`}</div>
      </div>
    </div>
  )
}

export default TransactionSettings

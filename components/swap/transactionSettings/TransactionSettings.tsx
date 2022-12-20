import { useContext, useState } from "react"

import { prettyBalance, prettyBalanceUSD } from "../../../utils/utils"
import styles from "./TransactionSettings.module.css"
import { SwapContext } from "../../../contexts/SwapContext"
import { WalletContext } from "../../../contexts/WalletContext"
import useTranslation from "next-translate/useTranslation"
import DownArrow from "../../DownArrow"

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
  const { userAddress } = useContext(WalletContext)
  const { estimatedGasFee } = useContext(SwapContext)

  const [isOpen, setIsOpen] = useState(false)

  const { t } = useTranslation("swap")

  let buy_price_element
  if (priceBuyUsd !== undefined) {
    buy_price_element = (
      <div className={styles.buy_price_info}>
        {/* <div>{t("token_buy_price", { tokenSymbol: buySymbol })}</div> */}
        <div className={styles.token_amount}>
          <div>{`1 ${buySymbol} = ${priceBuy} ${sellSymbol}`}</div>
          <div className={styles.usd_estimate}>{`~$${prettyBalanceUSD(priceBuyUsd)}`}</div>
        </div>
      </div>
    )
  }

  let sell_price_element
  if (priceSellUsd !== undefined) {
    sell_price_element = (
      <div className={styles.sell_price_info}>
        <div>{t("token_sell_price", { tokenSymbol: sellSymbol })}</div>
        <div className={styles.token_amount}>
          <div>{`${priceSell} ${buySymbol}`}</div>
          <div className={styles.usd_estimate}>{`~$${prettyBalanceUSD(priceSellUsd)}`}</div>
        </div>
      </div>
    )
  }

  // let gas_fee_element
  // if (estimatedGasFee !== undefined) {
  //   const estimatedGasFeeUsd = Number.isFinite(estimatedGasFee) && nativeCurrencyUsd ? prettyBalanceUSD(estimatedGasFee * nativeCurrencyUsd) : "0.0"
  //   gas_fee_element = (
  //     <div className={styles.gas_fee}>
  //       {/* <div></div> */}
  //       <div className={styles.token_amount}>
  //         {gas_icon}
  //         {/* <div>{`${prettyBalance(estimatedGasFee, 8)} ${nativeCurrencySymbol}`}</div> */}
  //         <div className={styles.usd_estimate}>{`$${estimatedGasFeeUsd}`}</div>
  //       </div>
  //     </div>
  //   )
  // } else if (userAddress) {
  //   gas_fee_element = (
  //     <div className={styles.gas_fee}>
  //       <div>{t("gas_fee")}</div>
  //       <div>Loading...</div>
  //     </div>
  //   )
  // }

  let estimatedGasFeeUsd
  if (estimatedGasFee !== undefined) {
    estimatedGasFeeUsd = Number.isFinite(estimatedGasFee) && nativeCurrencyUsd ? prettyBalanceUSD(estimatedGasFee * nativeCurrencyUsd) : "0.0"
  }

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setIsOpen(v => !v)}>
        <div className={styles.header_price}>
          {/* <div className={styles.token_amount}> */}
          <div>{`1 ${buySymbol} = ${priceBuy} ${sellSymbol}`}</div>
          <div className={styles.header_price_usd}>{priceBuyUsd ? `$${prettyBalanceUSD(priceBuyUsd)}` : ""}</div>
          {/* </div> */}
        </div>
        <div className={styles.header_gas}>
          {gas_icon}
          <div className={styles.usd_estimate}>{`$${estimatedGasFeeUsd}`}</div>
          <DownArrow />
        </div>
      </div>

      <div className={`${styles.details_container} ${isOpen ? "" : styles.hidden}`}>
        <div className={styles.details}>
          <div className={styles.detail}>
            <div>{sellSymbol} sell price</div>
            <div>
              {priceSell} {buySymbol}
            </div>
          </div>
          <div className={styles.detail}>
            <div>{buySymbol} buy price</div>
            <div>
              {priceBuy} {sellSymbol}
            </div>
          </div>
          <div className={styles.detail}>
            <div>Gas fee</div>
            <div>
              {estimatedGasFee} {nativeCurrencySymbol}
            </div>
          </div>
        </div>
      </div>
      {/* {buy_price_element} */}
      {/* {sell_price_element} */}
      {/* {gas_fee_element} */}
    </div>
  )

  // return (
  //   <div className={styles.container}>
  //     <div className={styles.title}>{t("transaction_settings")}</div>
  //     <hr className={styles.hr} />
  //     {buy_price_element}
  //     {sell_price_element}
  //     {gas_fee_element}
  //   </div>
  // )
}

export default TransactionSettings

const gas_icon = (
  <svg height="1em" viewBox="0 0 16 16" fill="none">
    <path
      d="M10.0047 9.26921H10.2714C11.0078 9.26921 11.6047 9.86617 11.6047 10.6025V12.1359C11.6047 12.7987 12.142 13.3359 12.8047 13.3359C13.4675 13.3359 14.0047 12.7995 14.0047 12.1367V5.22059C14.0047 4.86697 13.7758 4.56227 13.5258 4.31223L10.6714 1.33594M4.00472 2.00254H8.00472C8.7411 2.00254 9.33805 2.59949 9.33805 3.33587V14.0015H2.67139V3.33587C2.67139 2.59949 3.26834 2.00254 4.00472 2.00254ZM14.0047 5.33587C14.0047 6.07225 13.4078 6.66921 12.6714 6.66921C11.935 6.66921 11.3381 6.07225 11.3381 5.33587C11.3381 4.59949 11.935 4.00254 12.6714 4.00254C13.4078 4.00254 14.0047 4.59949 14.0047 5.33587Z"
      stroke="white"
    ></path>
    <line x1="4" y1="9.99414" x2="8" y2="9.99414" stroke="white"></line>
    <line x1="4" y1="11.9941" x2="8" y2="11.9941" stroke="white"></line>
    <path d="M4 8.16113H8" stroke="white"></path>
  </svg>
)

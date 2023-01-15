import { useContext, useEffect, useRef, useState } from "react"

import { prettyBalance, prettyBalanceUSD } from "../../../utils/utils"
import styles from "./TransactionSettings.module.css"
import { RouteMarket, SwapContext } from "../../../contexts/SwapContext"
import { WalletContext } from "../../../contexts/WalletContext"
import useTranslation from "next-translate/useTranslation"
import DownArrow from "../../DownArrow"
import { ExchangeContext } from "../../../contexts/ExchangeContext"
import { constants } from "ethers"

function TransactionSettings() {
  const { tokenPricesUSD, buyTokenInfo, sellTokenInfo, getTokenInfo } = useContext(ExchangeContext)
  const { network } = useContext(WalletContext)
  const { estimatedGasFee, swapPrice, tokensChanged, swapRoute } = useContext(SwapContext)

  const [isOpen, setIsOpen] = useState(false)
  const [routeString, setRoute] = useState<string>("")

  const headerPriceRef = useRef<HTMLDivElement>(null)
  const headerGasRef = useRef<HTMLDivElement>(null)
  const gasFeeDetailRef = useRef<HTMLDivElement>(null)
  const routeDetailRef = useRef<HTMLDivElement>(null)

  const priceSellRef = useRef<HTMLDivElement>(null)
  const priceBuyRef = useRef<HTMLDivElement>(null)

  const priceBuy =
    swapPrice !== undefined ? `${swapPrice !== 0 && Number.isFinite(swapPrice) ? prettyBalance(1 / swapPrice) : prettyBalance(0)}` : undefined

  console.log("priceBuy", priceBuy)
  const priceSell = swapPrice !== undefined ? `${prettyBalance(swapPrice)}` : undefined
  const priceBuyUsd = buyTokenInfo ? tokenPricesUSD[buyTokenInfo.address] : undefined
  const priceSellUsd = sellTokenInfo ? tokenPricesUSD[sellTokenInfo.address] : undefined

  const nativeCurrencyUsd = tokenPricesUSD[constants.AddressZero] ? tokenPricesUSD[constants.AddressZero] : 0
  const nativeCurrencySymbol = network?.nativeCurrency?.symbol ? network.nativeCurrency.symbol : "ETH"

  const { t } = useTranslation("swap")

  let estimatedGasFeeUsd
  if (estimatedGasFee !== undefined) {
    estimatedGasFeeUsd = Number.isFinite(estimatedGasFee) && nativeCurrencyUsd ? prettyBalanceUSD(estimatedGasFee * nativeCurrencyUsd) : "0.0"
  }

  useEffect(() => {
    const headerGas = headerGasRef.current
    if (headerGas) {
      headerGas.classList.remove(styles.update_animated)
      setTimeout(() => headerGas.classList.add(styles.update_animated), 10)
    }

    const gasFeeDetail = gasFeeDetailRef.current
    if (gasFeeDetail) {
      gasFeeDetail.classList.remove(styles.update_animated)
      setTimeout(() => gasFeeDetail.classList.add(styles.update_animated), 10)
    }
  }, [nativeCurrencyUsd, nativeCurrencyUsd, estimatedGasFee])

  useEffect(() => {
    const priceSell = priceSellRef.current
    if (priceSell) {
      priceSell.classList.remove(styles.update_animated)
      setTimeout(() => priceSell.classList.add(styles.update_animated), 10)
    }
  }, [priceSell, buyTokenInfo])

  useEffect(() => {
    const headerPrice = headerPriceRef.current
    if (headerPrice) {
      headerPrice.classList.remove(styles.update_animated)
      setTimeout(() => headerPrice.classList.add(styles.update_animated), 10)
    }

    const priceBuy = priceBuyRef.current
    if (priceBuy) {
      priceBuy.classList.remove(styles.update_animated)
      setTimeout(() => priceBuy.classList.add(styles.update_animated), 10)
    }
  }, [priceBuy])

  useEffect(() => {
    const routeDetails = routeDetailRef.current
    if (routeDetails) {
      routeDetails.classList.remove(styles.update_animated)
      setTimeout(() => routeDetails.classList.add(styles.update_animated), 10)
    }
  }, [routeString])

  useEffect(() => {
    let newRoute: string = ""
    if (!buyTokenInfo || !sellTokenInfo) {
      setRoute(newRoute)
      return
    }
    newRoute = `${sellTokenInfo?.symbol} >`

    for (let i = 1; i < swapRoute.length; i++) {
      const routeBuyTokenInfo = getTokenInfo(swapRoute[i].sellTokenAddress)
      if (routeBuyTokenInfo) {
        newRoute += ` ${routeBuyTokenInfo.symbol} >`
      }
    }
    newRoute += ` ${buyTokenInfo?.symbol}`
    setRoute(newRoute)
  }, [swapRoute])

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setIsOpen(v => !v)}>
        {buyTokenInfo && sellTokenInfo ? (
          tokensChanged ? (
            <PricePlaceholder />
          ) : (
            <>
              <div className={styles.header_price}>
                <div className={styles.header_price_token}>
                  1 {buyTokenInfo.symbol} = <div ref={headerPriceRef}>{priceBuy}</div> {sellTokenInfo.symbol}
                </div>
                <div className={styles.header_price_usd}>{priceBuyUsd ? `$${prettyBalanceUSD(priceBuyUsd)}` : ""}</div>
              </div>
            </>
          )
        ) : (
          <div />
        )}
        <div className={styles.header_gas} ref={headerGasRef}>
          {gas_icon}
          <div className={styles.usd_estimate}>{`$${estimatedGasFeeUsd}`}</div>
          <DownArrow up={isOpen} />
        </div>
      </div>

      <div className={`${styles.details_container} ${isOpen ? "" : styles.hidden}`}>
        <div className={styles.details}>
          <div className={styles.detail}>
            {buyTokenInfo && sellTokenInfo ? (
              <>
                <div> {t("token_sell_price", { tokenSymbol: sellTokenInfo.symbol })}</div>
                <div ref={priceSellRef}>
                  {tokensChanged || !buyTokenInfo ? (
                    <PricePlaceholder />
                  ) : (
                    `${priceSell} ${buyTokenInfo.symbol} ${priceSellUsd ? `~$${prettyBalanceUSD(priceSellUsd)}` : ""}`
                  )}
                </div>
              </>
            ) : (
              <div />
            )}
          </div>
          <div className={styles.detail}>
            {buyTokenInfo && sellTokenInfo ? (
              <>
                <div> {t("token_buy_price", { tokenSymbol: buyTokenInfo.symbol })}</div>
                <div ref={priceBuyRef}>
                  {tokensChanged ? (
                    <PricePlaceholder />
                  ) : (
                    `${priceBuy} ${sellTokenInfo.symbol} ${priceBuyUsd ? `~$${prettyBalanceUSD(priceBuyUsd)}` : ""}`
                  )}
                </div>
              </>
            ) : (
              <div />
            )}
          </div>
          <div className={styles.detail}>
            <div>{t("gas_fee")}</div>
            <div ref={gasFeeDetailRef}>
              {estimatedGasFee} {nativeCurrencySymbol}
            </div>
          </div>
          <div className={styles.detail}>
            <div>{t("route")}</div>
            <div ref={routeDetailRef}>
              {routeString}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
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

function PricePlaceholder() {
  return <div className={styles.price_placeholder} />
}

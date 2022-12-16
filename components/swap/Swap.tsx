import { useState, useContext } from "react"

import styles from "./Swap.module.css"
import SellInput from "./sellInput/SellInput"
import BuyInput from "./buyInput/BuyInput"
import Modal from "./modal/Modal"
import TransactionSettings from "./transactionSettings/TransactionSettings"
import SwapButton from "./swapButton/SwapButton"

import { ExchangeContext } from "../../contexts/ExchangeContext"
import { WalletContext } from "../../contexts/WalletContext"
import { SwapContext } from "../../contexts/SwapContext"
import { hideAddress, prettyBalance, prettyBalanceUSD } from "../../utils/utils"
import { constants, ethers } from "ethers"
import { INFO_ICON } from "../../public/commonIcons"

export enum ValidationState {
  OK,
  IsNaN,
  IsNegative,
  InsufficientBalance,
  ExceedsAllowance,
  InternalError,
}

function Swap() {
  console.log("SWAP RENDER")

  const [modal, setModal] = useState<"buy" | "sell" | null>(null)
  const [validationStateBuy, setValidationStateBuy] = useState<ValidationState>(ValidationState.OK)
  const [validationStateSell, setValidationStateSell] = useState<ValidationState>(ValidationState.OK)

  const { network } = useContext(WalletContext)
  const { allowances, balances, buyTokenInfo, sellTokenInfo, tokenPricesUSD, setBuyToken, setSellToken } = useContext(ExchangeContext)
  const { sellAmount, buyAmount, swapPrice } = useContext(SwapContext)

  const getBalanceReadable = (tokenAddress: string | null) => {
    if (tokenAddress && balances[tokenAddress]) {
      return prettyBalance(balances[tokenAddress].valueReadable)
    } else {
      return "0.0"
    }
  }

  const buyTokenSymbol = buyTokenInfo?.symbol ? buyTokenInfo?.symbol : "Token"
  const sellTokenSymbol = sellTokenInfo?.symbol ? sellTokenInfo?.symbol : "Token"

  const buyTokenAddress = buyTokenInfo?.address ? buyTokenInfo?.address : null
  const sellTokenAddress = sellTokenInfo?.address ? sellTokenInfo?.address : null

  const buyTokenUsdPrice = buyTokenAddress && tokenPricesUSD[buyTokenAddress] ? tokenPricesUSD[buyTokenAddress] : undefined
  const sellTokenUsdPrice = sellTokenAddress && tokenPricesUSD[sellTokenAddress] ? tokenPricesUSD[sellTokenAddress] : undefined

  // Estimated sell token value
  let sellTokenEstimatedValue
  if (sellTokenUsdPrice !== undefined) {
    sellTokenEstimatedValue = <div className={styles.estimated_value}>{`~$${prettyBalanceUSD(sellAmount * sellTokenUsdPrice)}`}</div>
  }

  // Estimated buy token value
  let buyTokenEstimatedValue
  if (buyTokenUsdPrice !== undefined) {
    let percent
    if (sellTokenUsdPrice !== undefined) percent = `(${prettyBalanceUSD(buyAmount * buyTokenUsdPrice - sellAmount * sellTokenUsdPrice)}%)`

    buyTokenEstimatedValue = <div className={styles.estimated_value}>{`~$${prettyBalanceUSD(buyAmount * buyTokenUsdPrice)} ${percent}`}</div>
  }

  // Error messages
  const sellErrorMessage = getErrorMessage(validationStateSell)
  const sellErrorElement = <div className={`${styles.error_element} ${sellErrorMessage ? "" : styles.hidden_error_element}`}>{sellErrorMessage}</div>
  const buyErrorMessage = getErrorMessage(validationStateBuy)
  const buyErrorElement = <div className={`${styles.error_element} ${buyErrorMessage ? "" : styles.hidden_error_element}`}>{buyErrorMessage}</div>

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Swap</h1>
      <div className={styles.from_to_container}>
        <div className={styles.from_container}>
          <div className={styles.from_header}>
            <div className={styles.from_title}>{INFO_ICON} From</div>
            <div className={styles.from_balance}>
              Balance: {getBalanceReadable(sellTokenAddress)} {sellTokenSymbol}
            </div>
          </div>
          <div className={styles.from_input_container}>
            <SellInput
              sellTokenInfo={sellTokenInfo}
              balance={sellTokenAddress && balances[sellTokenAddress] ? balances[sellTokenAddress].value : ethers.constants.Zero}
              allowance={sellTokenAddress ? allowances[sellTokenAddress] : ethers.constants.Zero}
              validationStateSell={validationStateSell}
              openModal={() => setModal("sell")}
              setValidationStateSell={setValidationStateSell}
            />
          </div>
          <div className={styles.below_input_container}>
            {sellErrorMessage ? (
              sellErrorElement
            ) : (
              <div className={styles.address_value_container}>
                <div>{sellTokenAddress}</div>
                {sellTokenEstimatedValue}
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className={styles.to_container}>
          <div className={styles.to_header}>
            <div className={styles.to_title}>{INFO_ICON} To</div>
            <div className={styles.to_balance}>
              Balance: {getBalanceReadable(buyTokenAddress)} {buyTokenSymbol}
            </div>
          </div>
          <div className={styles.to_input_container}>
            <BuyInput
              buyTokenInfo={buyTokenInfo}
              validationStateBuy={validationStateBuy}
              openModal={() => setModal("buy")}
              setValidationStateBuy={setValidationStateBuy}
            />
          </div>
          {/* <div className={styles.below_input_container}>
            <div>{buyTokenAddress}</div>
            <div className={styles.estimated_value}>{`~$${prettyBalanceUSD(buyAmount * buyTokenUsdPrice)}`}</div>
          </div> */}
          <div className={styles.below_input_container}>
            {buyErrorMessage ? (
              buyErrorElement
            ) : (
              <div className={styles.address_value_container}>
                <div>{buyTokenAddress}</div>
                {buyTokenEstimatedValue}
              </div>
            )}
          </div>
        </div>
      </div>
      {!!swapPrice && <TransactionSettings
          buySymbol={buyTokenSymbol}
          sellSymbol={sellTokenSymbol}
          priceBuy={`$${swapPrice !== 0 && Number.isFinite(swapPrice) ? prettyBalance(1 / swapPrice) : prettyBalance(0)}`}
          priceSell={`$${prettyBalance(swapPrice)}`}
          priceBuyUsd={buyTokenUsdPrice}
          priceSellUsd={sellTokenUsdPrice}
          nativeCurrencyUsd={tokenPricesUSD[constants.AddressZero] ? tokenPricesUSD[constants.AddressZero] : 0}
          nativeCurrencySymbol={network?.nativeCurrency?.symbol ? network.nativeCurrency.symbol : "ETH"}
        />
      }
      {!!swapPrice && <SwapButton validationStateBuy={validationStateBuy} validationStateSell={validationStateSell} /> }      
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

function Separator() {
  const { buyTokenInfo, sellTokenInfo, setBuyToken, setSellToken } = useContext(ExchangeContext)
  const { switchTokens } = useContext(SwapContext)

  function _switchTokens() {
    if (buyTokenInfo) setSellToken(buyTokenInfo.address)
    if (sellTokenInfo) setBuyToken(sellTokenInfo.address)
    switchTokens()
  }

  return (
    <div className={styles.arrow_container}>
      <hr className={styles.hr} />
      <svg className={styles.arrow} viewBox="0 0 490 490" fill="currentColor" onClick={_switchTokens}>
        <path
          d="M52.8,311.3c-12.8-12.8-12.8-33.4,0-46.2c6.4-6.4,14.7-9.6,23.1-9.6s16.7,3.2,23.1,9.6l113.4,113.4V32.7
c0-18,14.6-32.7,32.7-32.7c18,0,32.7,14.6,32.7,32.7v345.8L391,265.1c12.8-12.8,33.4-12.8,46.2,0c12.8,12.8,12.8,33.4,0,46.2
L268.1,480.4c-6.1,6.1-14.4,9.6-23.1,9.6c-8.7,0-17-3.4-23.1-9.6L52.8,311.3z"
        />
      </svg>
    </div>
  )
}

function getErrorMessage(validationState: ValidationState) {
  switch (validationState) {
    case ValidationState.ExceedsAllowance:
      return "Amount exceeds allowance."
    case ValidationState.InsufficientBalance:
      return "Amount exceeds balance."
    case ValidationState.InternalError:
      return "Internal error."
    case ValidationState.IsNaN:
      return "Amount cannot be NaN."
    case ValidationState.IsNegative:
      return "Amount cannot be negative."
    default:
      return
  }
}

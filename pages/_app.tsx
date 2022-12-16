import "../styles/globals.css"
import type { AppProps } from "next/app"

import WalletProvider from "../contexts/WalletContext"
import ExchangeProvider from "../contexts/ExchangeContext"
import SwapProvider from "../contexts/SwapContext"

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <ExchangeProvider>
        <SwapProvider>
          <Component {...pageProps} />
        </SwapProvider>
      </ExchangeProvider>
    </WalletProvider>
  )
}

export default MyApp

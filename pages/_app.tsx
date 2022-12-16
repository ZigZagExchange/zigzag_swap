import "../styles/globals.css"
import type { AppProps } from "next/app"

import WalletProvider from "../contexts/WalletContext"
import ExchangeProvider from "../contexts/ExchangeContext"

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <ExchangeProvider>
        <Component {...pageProps} />
      </ExchangeProvider>
    </WalletProvider>
  )
}

export default MyApp

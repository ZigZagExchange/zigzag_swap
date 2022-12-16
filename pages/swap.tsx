import type { NextPage } from "next"
import Layout from "../components/layout/Layout"
import SwapApp from "../components/swap/Swap"
import SwapProvider from "../contexts/SwapContext"

const Swap: NextPage = () => {
  return (
    <SwapProvider>
      <Layout>
        <SwapApp />
      </Layout>
    </SwapProvider>
  )
}

export default Swap

import type { NextPage } from "next"
import Layout from "../components/layout/Layout"
import SwapApp from "../components/swap/Swap"

const Home: NextPage = () => {
  return (
    <Layout>
      <SwapApp />
    </Layout>
  )
}

export default Home

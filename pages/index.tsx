import type { NextPage } from "next"
import Layout from "../components/layout/Layout"
import Swap from "../components/swap/Swap"

const Home: NextPage = () => {
  return (
    <Layout>
      <Swap />
    </Layout>
  )
}

export default Home

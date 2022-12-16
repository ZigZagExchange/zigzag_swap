import type { NextPage } from "next"
import Layout from "../components/layout/Layout"
import HomeApp from "../components/home/Home"

const Home: NextPage = () => {
  return (
    <Layout>
      <HomeApp />
    </Layout>
  )
}

export default Home

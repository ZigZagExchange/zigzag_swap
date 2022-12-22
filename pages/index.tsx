import type { NextPage } from "next"
import Head from "next/head"
import Layout from "../components/layout/Layout"
import Swap from "../components/swap/Swap"

const Home: NextPage = () => {
  return (
    <Layout>
      <Head>
        <title>Swap | ZigZag Exchange</title>
        <meta
          name="description"
          content="ZigZag is a native, easy-to-use, reliable, fully secure and low fee Decentralized Exchange built on ZK Rollups."
        ></meta>

        <meta property="og:type" content="website" />
        <meta property="og:title" content="ZigZag Exchange" />
        <meta property="og:description" content="The first decentralised casino powered by Zero-Knowledge proofs." />
        <meta property="og:url" content="https://swap.zigzag.exchange/" />
        <meta property="og:image" content={`https://swap.zigzag.exchange/favicon.ico`} />
        <meta content="#e92277" data-react-helmet="true" name="theme-color" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://swap.zigzag.exchange/" />
        <meta name="twitter:title" content="ZigZag Exchange" />
        <meta
          name="twitter:description"
          content="ZigZag is a native, easy-to-use, reliable, fully secure and low fee Decentralized Exchange built on ZK Rollups."
        />
        <meta name="twitter:image" content={`https://swap.zigzag.exchange/favicon.ico`} />
        <meta name="twitter:image:src" content={`https://swap.zigzag.exchange/favicon.ico`} />
      </Head>
      <Swap />
    </Layout>
  )
}

export default Home

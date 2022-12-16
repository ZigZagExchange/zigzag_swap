import { ReactNode, useState, useContext, useEffect } from "react"

import { useRouter } from "next/router"
import Link from "next/link"
import Image from "next/image"

import { WalletContext } from "../../contexts/WalletContext"

import logo from "../../public/img/zz.svg"
// import logo from "./logo.png"

import styles from "./Layout.module.css"
import FooterSocials from "../footerSocials/FooterSocials"
import ConnectWallet from "../connectWallet/ConnectWallet"
import NetworkSelector from "../NetworkSelector/NetworkSelector"
import HeaderSocials from "../HeaderSocials/HeaderSocials"

interface Props {
  children?: ReactNode
}

function Layout(props: Props) {
  const { userAddress, network, ethersProvider } = useContext(WalletContext)
  const [headerWarning, setHeaderWarning] = useState<JSX.Element | null>(null)

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)

  const router = useRouter()

  useEffect(() => {
    if (ethersProvider && network) {
      ethersProvider.getNetwork().then(proivderNetwork => {
        if (proivderNetwork.chainId === network.networkId) {
          setHeaderWarning(null)
          return
        }
      })
    }
    if (userAddress) {
      setHeaderWarning(
        <div className={styles.header_warning_container}>
          <strong>{"Please change the Network"}</strong> <span>{"Please change the Network"}</span>
        </div>
      )
    }
    setHeaderWarning(null)
  }, [ethersProvider, network])

  let headerLeft = (
    <nav className={styles.header_left}>
      <Link href="/">
        <a className={`${styles.nav_link}`}>
          <span className={`${styles.icon}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Image src={logo} alt="logo" width="30" />
          </span>
        </a>
      </Link>
      <Link href="/swap">
        <a className={`${styles.nav_link} ${styles.named_nav_link} ${router.route === "/swap" ? styles.active_nav_link : ""}`}>Swap</a>
      </Link>
      <Link href="https://trade.zigzag.exchange/">
        <a className={`${styles.nav_link} ${styles.named_nav_link} ${router.route === "/trade" ? styles.active_nav_link : ""}`}>Orderbook</a>
      </Link>
      {/* Link */}
      {/* <HeaderSocials /> */}
      {/* <NetworkSelector /> */}
    </nav>
  )

  return (
    <>
      <header className={`${styles.header} ${styles.mobile} ${isMenuOpen ? styles.menu_open : ""}`}>
        {headerWarning}
        {headerLeft}
        <div className={styles.header_right}>
          <ConnectWallet />
        </div>
      </header>

      <main className={styles.content}>{props.children}</main>
      <footer className={styles.footer}>
        <FooterSocials />
      </footer>
    </>
  )
}

export default Layout

import { useState, useContext } from "react"

import Jazzicon, { jsNumberForAddress } from "react-jazzicon"

import { WalletContext } from "../../contexts/WalletContext"

import styles from "./ConnectWallet.module.css"
import DownArrow from "../DownArrow"
import ConnectButtonDropdown from "./ConnectButtonDropdown"
import { hideAddress } from "../../utils/utils"
import useTranslation from "next-translate/useTranslation"

function ConnectWallet() {
  const { userAddress, username, network, connect, disconnect } = useContext(WalletContext)
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false)

  const { t } = useTranslation("common")

  function openProfile() {
    setIsProfileOpen(true)
  }

  function closeProfile() {
    setIsProfileOpen(false)
  }

  if (!userAddress) {
    return (
      <div className={styles.container}>
        <button
          className={styles.connect_button}
          onClick={() => {
            connect()
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6 2C3.79086 2 2 3.79086 2 6V8V18C2 20.2091 3.79086 22 6 22H18C20.2091 22 22 20.2091 22 18V10C22 7.79086 20.2091 6 18 6C18 3.79086 16.2091 2 14 2H6ZM16 6H4C4 4.89543 4.89543 4 6 4H14C15.1046 4 16 4.89543 16 6ZM4 18V8H18C19.1046 8 20 8.89543 20 10V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18ZM14 13C13.4477 13 13 13.4477 13 14C13 14.5523 13.4477 15 14 15H17C17.5523 15 18 14.5523 18 14C18 13.4477 17.5523 13 17 13H14Z"
              // fill="#5599FF"
            />
          </svg>
          {t("connect_wallet")}
        </button>
      </div>
    )
  } else {
    let usernameOrAddress
    if (username) {
      usernameOrAddress = <div className={styles.username}>{username}</div>
    } else if (userAddress) {
      usernameOrAddress = <div className={styles.address}>{hideAddress(userAddress)}</div>
    }

    return (
      <div className={styles.container} onMouseEnter={openProfile} onMouseLeave={closeProfile} onClick={isProfileOpen ? closeProfile : openProfile}>
        <div className={styles.profile_button}>
          <div className={styles.profile_image_container}>
            <Jazzicon diameter={30} seed={jsNumberForAddress(userAddress)} />
          </div>
          <div className={styles.username_address_container}>{usernameOrAddress}</div>
          <div className={styles.arrow}>
            <DownArrow />
          </div>
        </div>
        <div className={styles.profile_anchor}>
          {isProfileOpen ? (
            <ConnectButtonDropdown
              close={closeProfile}
              disconnect={disconnect}
              networkId={network?.networkId ? network?.networkId : 0}
              userAddress={userAddress}
            />
          ) : null}
        </div>
      </div>
    )
  }
}

export default ConnectWallet

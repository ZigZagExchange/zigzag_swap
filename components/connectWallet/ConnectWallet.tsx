import { useState, useContext } from "react"

import Jazzicon, { jsNumberForAddress } from "react-jazzicon"

import { WalletContext } from "../../contexts/WalletContext"

import styles from "./ConnectWallet.module.css"
import DownArrow from "../DownArrow"
import ConnectButtonDropdown from "./ConnectButtonDropdown"
import { hideAddress } from "../../utils/utils"

function ConnectWallet() {
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false)

  const { userAddress, username, network, connect, disconnect } = useContext(WalletContext)

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
          {"Connect Wallet"}
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
            <Jazzicon diameter={40} seed={jsNumberForAddress(userAddress)} />
          </div>
          <div className={styles.username_address_container}>
            {usernameOrAddress}
            {/* <div>
              <DownArrow style={{ borderColor: "var(--gray_lighter)" }} />
            </div> */}
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

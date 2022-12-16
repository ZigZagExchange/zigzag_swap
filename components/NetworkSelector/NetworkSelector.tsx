import { useContext, useState } from "react"
import DownArrow from "../DownArrow"
import styles from "./NetworkSelector.module.css"

import { WalletContext } from "../../contexts/WalletContext"
import { networkSelectorOrder, NETWORKS } from "../../data/networks"

function NetworkSelector() {
  const { network, switchNetwork } = useContext(WalletContext)
  const [showDropdown, setShowDropdown] = useState<boolean>(false)

  const networkList = []
  for (let i = 0; i < networkSelectorOrder.length; i++) {
    const key = networkSelectorOrder[i]
    if (network && key === network.networkId) continue

    const networkOption = NETWORKS[key]

    networkList.push(
      <div
        key={key}
        className={styles.network_entry}
        onClick={() => switchNetwork(networkOption.networkId) }
      >
        <span className={styles.network_icon}>{networkOption.icon}</span> {networkOption.name}
      </div>
    )
  }

  return (
    <div
      className={styles.container}
      onMouseLeave={() => {
        setShowDropdown(false)
      }}
      onClick={() => setShowDropdown(false)}
    >
      <div
        className={`${styles.selected} ${showDropdown ? styles.active_selected : ""} ${network?.networkId === undefined || network?.networkId === null ? styles.wrong_network : ""}`}
        onMouseEnter={() => setShowDropdown(true)}
      >
        <span className={styles.selected_network_icon}>
          {network && (network.networkId === undefined || network.networkId !== null) ? NETWORKS[network.networkId].icon : <div className={styles.warning_ball} />}
        </span>{" "}
        <div className={styles.selected_name_container}>{network.name}</div>
        {networkList.length > 0 ? <DownArrow /> : ""}
      </div>
      <div
        style={{
          opacity: showDropdown ? "1" : "0",
          pointerEvents: showDropdown ? "all" : "none",
        }}
        className={styles.dropdown_container}
      >
        {networkList}
      </div>
    </div>
  )
}

export default NetworkSelector
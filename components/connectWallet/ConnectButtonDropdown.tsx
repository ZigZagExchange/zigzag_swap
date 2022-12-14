import { useEffect, useRef } from "react"
import styles from "./ConnectButtonDropdown.module.css"
import { LOGOUT_ICON, REDIRECT_SVG } from "../../public/commonIcons"
import { NETWORKS } from "../../data/networks"

interface Props {
  close: () => void
  disconnect: () => void
  networkId: number
  address: string
}

function ConnectButtonDropdown(props: Props) {
  const container_ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = container_ref.current
    if (!container) return
    container.focus()
  }, [])

  return (
    <div ref={container_ref} className={styles.container}>
      <>
        <a
          href={(props.networkId && props.address) ? `${NETWORKS[props.networkId].explorerUrl}address/${props.address}` : undefined}
          target="_blank"
          rel="noopener noreferrer"
        >
          <button>
            {REDIRECT_SVG} {"view_in_explorer"}
          </button>
        </a>

        <button onClick={props.disconnect}>
          {LOGOUT_ICON} {"disconnect"}
        </button>
      </>      
    </div>
  )
}

export default ConnectButtonDropdown
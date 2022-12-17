import { useEffect, useRef } from "react"
import styles from "./ConnectButtonDropdown.module.css"
import { LOGOUT_ICON, REDIRECT_SVG } from "../../public/commonIcons"
import { NETWORKS } from "../../data/networks"
import useTranslation from "next-translate/useTranslation"

interface Props {
  close: () => void
  disconnect: () => void
  networkId: number
  userAddress: string
}

function ConnectButtonDropdown(props: Props) {
  const container_ref = useRef<HTMLDivElement>(null)
  const { t } = useTranslation("common")
  useEffect(() => {
    const container = container_ref.current
    if (!container) return
    container.focus()
  }, [])

  return (
    <div ref={container_ref} className={styles.container}>
      <>
        <a
          href={props.networkId && props.userAddress ? `${NETWORKS[props.networkId].explorerUrl}address/${props.userAddress}` : undefined}
          target="_blank"
          rel="noopener noreferrer"
        >
          <button>
            {REDIRECT_SVG} <div className={styles.button_text}>{t("view_in_explorer")}</div>
          </button>
        </a>
        <a>
          <button onClick={props.disconnect}>
            {LOGOUT_ICON} <div className={styles.button_text}>{t("disconnect")}</div>
          </button>
        </a>
      </>
    </div>
  )
}

export default ConnectButtonDropdown

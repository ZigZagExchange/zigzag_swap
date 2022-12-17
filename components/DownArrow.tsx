import { CSSProperties } from "react"
import styles from "./DownArrow.module.css"

interface Props {
  up?: boolean
}

function DownArrow({ up }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.arrow} style={up ? { rotate: "180deg", translate: "0 0.2em 0" } : {}}></div>
    </div>
  )
}

export default DownArrow

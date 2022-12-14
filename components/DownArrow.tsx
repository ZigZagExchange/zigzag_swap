import { CSSProperties } from "react"
import styles from "./DownArrow.module.css"

interface Props {
  style?: CSSProperties
}

function DownArrow({ style }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.arrow} style={style}></div>
    </div>
  )
}

export default DownArrow
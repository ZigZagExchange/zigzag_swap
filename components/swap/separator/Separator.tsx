import { useContext, useEffect, useRef } from "react"
import { ExchangeContext } from "../../../contexts/ExchangeContext"
import { SwapContext } from "../../../contexts/SwapContext"
import styles from "./Separator.module.css"

function Separator({ onClick }: { onClick: () => void }) {
  const { orderBook } = useContext(SwapContext)
  const bar_ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = bar_ref.current
    if (!bar) return
    const animation = bar.animate([{ transform: "scaleX(100%)" }, { transform: "scaleX(0%)" }], { iterations: 1, duration: 5000, fill: "forwards" })
    return () => animation.cancel()
  }, [orderBook])

  return (
    <div className={styles.container}>
      <div className={styles.bar_bg}>
        <div ref={bar_ref} className={styles.bar_fg}></div>
      </div>
      <svg className={styles.arrow} viewBox="0 0 490 490" fill="currentColor" onClick={onClick}>
        <path
          d="M52.8,311.3c-12.8-12.8-12.8-33.4,0-46.2c6.4-6.4,14.7-9.6,23.1-9.6s16.7,3.2,23.1,9.6l113.4,113.4V32.7
  c0-18,14.6-32.7,32.7-32.7c18,0,32.7,14.6,32.7,32.7v345.8L391,265.1c12.8-12.8,33.4-12.8,46.2,0c12.8,12.8,12.8,33.4,0,46.2
  L268.1,480.4c-6.1,6.1-14.4,9.6-23.1,9.6c-8.7,0-17-3.4-23.1-9.6L52.8,311.3z"
        />
      </svg>
    </div>
  )
}

export default Separator

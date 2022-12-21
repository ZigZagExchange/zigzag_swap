import { useRef, useContext, useState, useMemo, useEffect } from "react"
import styles from "./Modal.module.css"
import TokenListEntry from "../modals/tokenSelectModal/tokenListEntry/TokenListEntry"

import { prettyBalance, prettyBalanceUSD } from "../../../utils/utils"
import { ExchangeContext } from "../../../contexts/ExchangeContext"
import useTranslation from "next-translate/useTranslation"
import TokenSelectModal from "../modals/tokenSelectModal/TokenSelectModal"
import ApproveModal from "../modals/approveModal/ApproveModal"
import SwapModal from "../modals/swapModal/SwapModal"
import WrapModal from "../modals/wrapModal/WrapModal"
import UnwrapModal from "../modals/unwrapModal/UnwrapModal"

export type ModalMode = "selectBuyToken" | "selectSellToken" | "approve" | "swap" | "wrap" | "unwrap" | null

interface Props {
  selectedModal: ModalMode
  onTokenClick: (tokenAddress: string) => void
  close: () => void
}

export default function Modal({ selectedModal, onTokenClick, close }: Props) {
  const container_ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const isOpen = selectedModal !== null
    const close = (e: any) => {
      if (e.key === "Escape") {
        close_modal()
      }
    }
    if (isOpen) window.addEventListener("keydown", close)
    return () => window.removeEventListener("keydown", close)
  }, [selectedModal])

  function close_modal() {
    close()
  }

  if (selectedModal === "selectBuyToken" || selectedModal === "selectSellToken") {
    return (
      <div
        className={`${styles.container} ${!selectedModal ? styles.hidden : ""}`}
        onClick={e => (e.target === container_ref.current ? close_modal() : null)}
        ref={container_ref}
      >
        <div className={styles.modal}>
          <TokenSelectModal selectedModal={selectedModal} onTokenClick={onTokenClick} close={close_modal} />
        </div>
      </div>
    )
  } else if (selectedModal === "approve") {
    return (
      <div
        className={`${styles.container} ${!selectedModal ? styles.hidden : ""}`}
        onClick={e => (e.target === container_ref.current ? close_modal() : null)}
        ref={container_ref}
      >
        <div className={styles.modal}>
          <ApproveModal close={close_modal} />
        </div>
      </div>
    )
  } else if (selectedModal === "swap") {
    return (
      <div
        className={`${styles.container} ${!selectedModal ? styles.hidden : ""}`}
        onClick={e => (e.target === container_ref.current ? close_modal() : null)}
        ref={container_ref}
      >
        <div className={styles.modal}>
          <SwapModal close={close_modal} />
        </div>
      </div>
    )
  } else if (selectedModal === "wrap") {
    return (
      <div
        className={`${styles.container} ${!selectedModal ? styles.hidden : ""}`}
        onClick={e => (e.target === container_ref.current ? close_modal() : null)}
        ref={container_ref}
      >
        <div className={styles.modal}>
          <WrapModal close={close_modal} />
        </div>
      </div>
    )
  } else if (selectedModal === "unwrap") {
    return (
      <div
        className={`${styles.container} ${!selectedModal ? styles.hidden : ""}`}
        onClick={e => (e.target === container_ref.current ? close_modal() : null)}
        ref={container_ref}
      >
        <div className={styles.modal}>
          <UnwrapModal close={close_modal} />
        </div>
      </div>
    )
  } else return <></>
}

export const rightArrow = (
  <svg viewBox="0 0 490 490" height="1em">
    <path d="M15.541,490V0l458.917,245.009L15.541,490z" />
  </svg>
)

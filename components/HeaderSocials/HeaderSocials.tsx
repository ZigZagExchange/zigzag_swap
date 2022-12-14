import { useState } from "react"

import styles from "./HeaderSocials.module.css"


function HeaderSocials() {
  const [showLandingPage, setShowLandingPage] = useState<boolean>(false)
  const [showDocs, setShowDocs] = useState<boolean>(false)
  const [showTwitter, setShowTwitter] = useState<boolean>(false)
  const [showDiscord, setShowDiscord] = useState<boolean>(false)
  const [showTelegram, setShowTelegram] = useState<boolean>(false)
  const [showGitHub, setShowGitHub] = useState<boolean>(false)
  const [showMedium, setShowMedium] = useState<boolean>(false)

  return (
    <>
      {/* landing page */}
      <div
        className={styles.container}
        onMouseLeave={() => { setShowLandingPage(false) }}
        onClick={() => setShowLandingPage(false)}
      >
        < div className={`${styles.selected} ${showLandingPage ? styles.active_selected : ""}`}
          onMouseEnter={() => setShowLandingPage(true)}
        >
          <a href="https://zigzag.exchange" target="_blank" rel="noopener noreferrer" className={styles.icon_container}>
            <span className={styles.socials_icon}>
              <svg className={styles.icon} viewBox="0 0 24 24" height="1em">
                <path d="M12,0A12,12,0,1,0,24,12,12.013,12.013,0,0,0,12,0Zm8.647,7H17.426a19.676,19.676,0,0,0-2.821-4.644A10.031,10.031,0,0,1,20.647,7ZM16.5,12a10.211,10.211,0,0,1-.476,3H7.976A10.211,10.211,0,0,1,7.5,12a10.211,10.211,0,0,1,.476-3h8.048A10.211,10.211,0,0,1,16.5,12ZM8.778,17h6.444A19.614,19.614,0,0,1,12,21.588,19.57,19.57,0,0,1,8.778,17Zm0-10A19.614,19.614,0,0,1,12,2.412,19.57,19.57,0,0,1,15.222,7ZM9.4,2.356A19.676,19.676,0,0,0,6.574,7H3.353A10.031,10.031,0,0,1,9.4,2.356ZM2.461,9H5.9a12.016,12.016,0,0,0-.4,3,12.016,12.016,0,0,0,.4,3H2.461a9.992,9.992,0,0,1,0-6Zm.892,8H6.574A19.676,19.676,0,0,0,9.4,21.644,10.031,10.031,0,0,1,3.353,17Zm11.252,4.644A19.676,19.676,0,0,0,17.426,17h3.221A10.031,10.031,0,0,1,14.605,21.644ZM21.539,15H18.1a12.016,12.016,0,0,0,.4-3,12.016,12.016,0,0,0-.4-3h3.437a9.992,9.992,0,0,1,0,6Z" />
              </svg>
            </span>
            <div className={styles.selected_name_container}>{"Lading Page"}</div>
          </a>
        </div >
      </div >

      {/* docs */}
      <div
        className={styles.container}
        onMouseLeave={() => { setShowDocs(false) }}
        onClick={() => setShowDocs(false)}
      >
        < div className={`${styles.selected} ${showDocs ? styles.active_selected : ""}`}
          onMouseEnter={() => setShowDocs(true)}
        >
          <a href="https://docs.zigzag.exchange/" target="_blank" rel="noopener noreferrer" className={styles.icon_container}>
            <span className={styles.socials_icon}>
              <svg viewBox="0 100 1000 750" height="1em" className={styles.icon}>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M562.168 159.724l325.95 162.727c15.062 7.519 15.298 28.898.404 36.746L465.19 582.283a82.875 82.875 0 01-75.639.83L123.74 450.409c-32.376-12.972-68.568 10.748-68.568 46.474 0 28.728 16.256 54.991 41.99 67.839l266.48 133.036c16.267-16.537 38.918-26.795 63.967-26.795 24.334 0 46.404 9.68 62.558 25.394L822.075 521.45a89.893 89.893 0 01-1.385-15.755c0-49.44 40.14-89.519 89.655-89.519S1000 456.255 1000 505.695c0 49.439-40.14 89.518-89.655 89.518-24.21 0-46.178-9.581-62.31-25.153L515.94 745.065a90.036 90.036 0 011.324 15.417c0 49.439-40.14 89.518-89.655 89.518s-89.655-40.079-89.655-89.518c0-4.572.343-9.063 1.006-13.451L68.622 612.068C26.566 591.072 0 548.153 0 501.205v-26.15c0-35.755 19.82-68.574 51.49-85.261l435.039-229.24a82.87 82.87 0 0175.639-.83zM427.609 794.912c19.044 0 34.483-15.415 34.483-34.43 0-19.016-15.439-34.431-34.483-34.431-19.044 0-34.482 15.415-34.482 34.431 0 19.015 15.438 34.43 34.482 34.43zm517.219-289.217c0 19.015-15.438 34.43-34.483 34.43-19.044 0-34.482-15.415-34.482-34.43s15.438-34.43 34.482-34.43c19.045 0 34.483 15.415 34.483 34.43z"
                ></path>
              </svg>
            </span>
            <div className={styles.selected_name_container}>{"Docs"}</div>
          </a>
        </div >
      </div >

      {/* twitter */}
      <div
        className={styles.container}
        onMouseLeave={() => { setShowTwitter(false) }}
        onClick={() => setShowTwitter(false)}
      >
      < div className={`${styles.selected} ${showTwitter ? styles.active_selected : ""}`}
        onMouseEnter={() => setShowTwitter(true)}
      >
        <a href="https://twitter.com/ZigZagExchange/" target="_blank" rel="noopener noreferrer" className={styles.icon_container}>
          <span className={styles.socials_icon}>
            <svg className={styles.icon} height="1em" viewBox="0 0 50 50">
              <path d="M 50.0625 10.4375 C 48.214844 11.257813 46.234375 11.808594 44.152344 12.058594 C 46.277344 10.785156 47.910156 8.769531 48.675781 6.371094 C 46.691406 7.546875 44.484375 8.402344 42.144531 8.863281 C 40.269531 6.863281 37.597656 5.617188 34.640625 5.617188 C 28.960938 5.617188 24.355469 10.21875 24.355469 15.898438 C 24.355469 16.703125 24.449219 17.488281 24.625 18.242188 C 16.078125 17.8125 8.503906 13.71875 3.429688 7.496094 C 2.542969 9.019531 2.039063 10.785156 2.039063 12.667969 C 2.039063 16.234375 3.851563 19.382813 6.613281 21.230469 C 4.925781 21.175781 3.339844 20.710938 1.953125 19.941406 C 1.953125 19.984375 1.953125 20.027344 1.953125 20.070313 C 1.953125 25.054688 5.5 29.207031 10.199219 30.15625 C 9.339844 30.390625 8.429688 30.515625 7.492188 30.515625 C 6.828125 30.515625 6.183594 30.453125 5.554688 30.328125 C 6.867188 34.410156 10.664063 37.390625 15.160156 37.472656 C 11.644531 40.230469 7.210938 41.871094 2.390625 41.871094 C 1.558594 41.871094 0.742188 41.824219 -0.0585938 41.726563 C 4.488281 44.648438 9.894531 46.347656 15.703125 46.347656 C 34.617188 46.347656 44.960938 30.679688 44.960938 17.09375 C 44.960938 16.648438 44.949219 16.199219 44.933594 15.761719 C 46.941406 14.3125 48.683594 12.5 50.0625 10.4375 Z" />
            </svg>
          </span>
          <div className={styles.selected_name_container}>{"Twitter"}</div>
        </a>
        </div >
      </div>   


      {/* discord */}
      <div
        className={styles.container}
        onMouseLeave={() => { setShowDiscord(false) }}
        onClick={() => setShowDiscord(false)}
      >
        < div className={`${styles.selected} ${showDiscord ? styles.active_selected : ""}`}
          onMouseEnter={() => setShowDiscord(true)}
        >
          <a href="https://discord.gg/zigzag/" target="_blank" rel="noopener noreferrer" className={styles.icon_container}>
            <span className={styles.socials_icon}>
              <svg height="1em" viewBox="0 0 16 13" className={styles.icon}>
                <path d="M13.5447 1.7704C12.5249 1.30248 11.4313 0.957738 10.2879 0.760289C10.2671 0.756478 10.2463 0.766001 10.2356 0.785048C10.0949 1.03519 9.93915 1.36152 9.83006 1.61802C8.60027 1.43391 7.37679 1.43391 6.17221 1.61802C6.0631 1.35582 5.90166 1.03519 5.76038 0.785048C5.74966 0.766637 5.72886 0.757114 5.70803 0.760289C4.56527 0.957107 3.47171 1.30185 2.45129 1.7704C2.44246 1.77421 2.43488 1.78057 2.42986 1.78881C0.355594 4.88772 -0.212633 7.91046 0.0661201 10.8957C0.0673814 10.9103 0.0755799 10.9243 0.086932 10.9332C1.45547 11.9382 2.78114 12.5483 4.08219 12.9528C4.10301 12.9591 4.12507 12.9515 4.13832 12.9343C4.44608 12.5141 4.72043 12.0709 4.95565 11.6049C4.96953 11.5776 4.95628 11.5452 4.92791 11.5344C4.49275 11.3693 4.0784 11.1681 3.67982 10.9395C3.64829 10.9211 3.64577 10.876 3.67477 10.8544C3.75865 10.7916 3.84255 10.7262 3.92264 10.6602C3.93713 10.6481 3.95732 10.6456 3.97435 10.6532C6.59286 11.8487 9.4277 11.8487 12.0153 10.6532C12.0323 10.6449 12.0525 10.6475 12.0677 10.6595C12.1478 10.7256 12.2316 10.7916 12.3161 10.8544C12.3451 10.876 12.3433 10.9211 12.3117 10.9395C11.9131 11.1725 11.4988 11.3693 11.063 11.5338C11.0346 11.5446 11.022 11.5776 11.0359 11.6049C11.2762 12.0703 11.5505 12.5134 11.8526 12.9337C11.8652 12.9515 11.8879 12.9591 11.9087 12.9528C13.2161 12.5483 14.5417 11.9382 15.9103 10.9332C15.9223 10.9243 15.9298 10.911 15.9311 10.8964C16.2647 7.44506 15.3723 4.44711 13.5655 1.78944C13.5611 1.78057 13.5535 1.77421 13.5447 1.7704ZM5.34668 9.07801C4.55833 9.07801 3.90876 8.35425 3.90876 7.46539C3.90876 6.57653 4.54574 5.85277 5.34668 5.85277C6.15392 5.85277 6.79721 6.58289 6.78459 7.46539C6.78459 8.35425 6.14761 9.07801 5.34668 9.07801ZM10.6632 9.07801C9.87484 9.07801 9.22526 8.35425 9.22526 7.46539C9.22526 6.57653 9.86222 5.85277 10.6632 5.85277C11.4704 5.85277 12.1137 6.58289 12.1011 7.46539C12.1011 8.35425 11.4704 9.07801 10.6632 9.07801Z"></path>
              </svg>
            </span>
            <div className={styles.selected_name_container}>{"Discord"}</div>
          </a>
        </div >
      </div>   

      {/* Telegram */}
      <div
        className={styles.container}
        onMouseLeave={() => { setShowTelegram(false) }}
        onClick={() => setShowTelegram(false)}
      >
        < div className={`${styles.selected} ${showTelegram ? styles.active_selected : ""}`}
          onMouseEnter={() => setShowTelegram(true)}
        >
          <a href="https://t.me/zigzagexchange/" target="_blank" rel="noopener noreferrer" className={styles.icon_container}>
            <span className={styles.socials_icon}>
              <svg height="1em" viewBox="0 0 50 50" className={styles.icon}>
                <path d="M46.137,6.552c-0.75-0.636-1.928-0.727-3.146-0.238l-0.002,0C41.708,6.828,6.728,21.832,5.304,22.445	c-0.259,0.09-2.521,0.934-2.288,2.814c0.208,1.695,2.026,2.397,2.248,2.478l8.893,3.045c0.59,1.964,2.765,9.21,3.246,10.758	c0.3,0.965,0.789,2.233,1.646,2.494c0.752,0.29,1.5,0.025,1.984-0.355l5.437-5.043l8.777,6.845l0.209,0.125	c0.596,0.264,1.167,0.396,1.712,0.396c0.421,0,0.825-0.079,1.211-0.237c1.315-0.54,1.841-1.793,1.896-1.935l6.556-34.077	C47.231,7.933,46.675,7.007,46.137,6.552z M22,32l-3,8l-3-10l23-17L22,32z" />
              </svg>
            </span>
            <div className={styles.selected_name_container}>{"Telegram"}</div>
          </a>
        </div >
      </div>   

      {/* GitHub */}
      <div
        className={styles.container}
        onMouseLeave={() => {
          setShowGitHub(false)
        }}
        onClick={() => setShowGitHub(false)}
      >
        < div className={`${styles.selected} ${showGitHub ? styles.active_selected : ""}`}
          onMouseEnter={() => setShowGitHub(true)}
        >
          <a href="https://docs.zigzag.exchange/" target="_blank" rel="noopener noreferrer" className={styles.icon_container}>
            <span className={styles.socials_icon}>
              <svg height="1em" viewBox="0 0 24 24" className={styles.icon}>
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </span>
            <div className={styles.selected_name_container}>{"GitHub"}</div>
          </a>
        </div >
      </div>   

      {/* Medium */}
      <div
        className={styles.container}
        onMouseLeave={() => { setShowMedium(false) }}
        onClick={() => setShowMedium(false)}
      >
        < div className={`${styles.selected} ${showMedium ? styles.active_selected : ""}`}
          onMouseEnter={() => setShowMedium(true)}
        >
          <a href="https://medium.com/@ZigZagExchange/" target="_blank" rel="noopener noreferrer" className={styles.icon_container}>
            <span className={styles.socials_icon}>
              <svg height="1em" viewBox="0 0 24 24" className={styles.icon}>
                <path d="M2.846 6.887c.03-.295-.083-.586-.303-.784l-2.24-2.7v-.403h6.958l5.378 11.795 4.728-11.795h6.633v.403l-1.916 1.837c-.165.126-.247.333-.213.538v13.498c-.034.204.048.411.213.537l1.871 1.837v.403h-9.412v-.403l1.939-1.882c.19-.19.19-.246.19-.537v-10.91l-5.389 13.688h-.728l-6.275-13.688v9.174c-.052.385.076.774.347 1.052l2.521 3.058v.404h-7.148v-.404l2.521-3.058c.27-.279.39-.67.325-1.052v-10.608z" />
              </svg>
            </span>
            <div className={styles.selected_name_container}>{"Medium"}</div>
          </a>
        </div >
      </div>
    </>
  )
}

export default HeaderSocials
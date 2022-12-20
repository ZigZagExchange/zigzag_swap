import { useEffect, useState } from "react"

export default function useCountdown(target: number | undefined) {
  if (target === undefined) return undefined

  const [countdown, setCountdown] = useState<number>(target - Math.trunc(new Date().getTime() / 1000))
  useEffect(() => {
    setCountdown(target - new Date().getTime() * 1000)
    const interval = setInterval(() => setCountdown(target - Math.trunc(new Date().getTime() / 1000)))
    return () => clearInterval(interval)
  }, [target])

  return countdown
}

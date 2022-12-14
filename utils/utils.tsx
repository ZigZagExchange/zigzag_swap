export function balanceCommas(balance: string) {
  let [integer, decimal] = balance.split(".")
  integer = integer
    .split("")
    .reverse()
    .reduce((c, p) => c + p)
  const parts = []
  for (let i = 0; i < integer.length; i += 3) {
    const part = integer.slice(i, i + 3)
    parts.push(
      part
        .split("")
        .reverse()
        .reduce((c, p) => c + p)
    )
  }
  integer = parts.reduce((c, p) => (p === "-" ? p + c : p + "," + c))
  const result = decimal === undefined ? integer : integer + "." + decimal
  return result
}

export function prettyBalance(balance: number, decimals: number = 6) {
  const truncattedAmount = String(parseFloat(balance.toFixed(decimals)))
  if (truncattedAmount.includes(".")) {
    const decimalPart = truncattedAmount.split(".").slice(-1)[0]
    if (truncattedAmount === "") {
      return "0"
    }
    if (decimalPart.length < decimals) {
      // console.log("decimal_part too small")
      return balanceCommas(
        truncattedAmount +
        Array(decimals - decimalPart.length)
          .fill(0)
          .join("")
      )
    }
    return balanceCommas(truncattedAmount)
  } else {
    return balanceCommas(truncattedAmount + (decimals > 0 ? "." : "") + Array(decimals).fill(0).join(""))
  }
}
export function prettyBalanceUSD(balance: number) { 
  return prettyBalance(balance, 2)
}

export function hideAddress(address: string, digits = 4) {
  return address.slice(0, 2 + digits) + "•••" + address.slice(-digits)
}
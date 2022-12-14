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
  const result = decimal === undefined ? integer : integer + "." + Number(decimal).toString()
  return result
}

export function prettyBalance(balance: number | string, decimals: number = 6) {
  const truncattedAmount = String(parseFloat(Number(balance).toFixed(decimals)))
  if (truncattedAmount.includes(".")) {
    const decimalPart = truncattedAmount.split(".").slice(-1)[0]
    if (truncattedAmount === "") {
      return "0"
    }
    if (decimalPart.length < decimals) {
      // console.log("decimalPart too small")
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

export function truncateDecimals(numberString: string, decimals: number, padDecimals: boolean = false) {
  const separator = "."
  let splitAtDecimal = numberString.replace(",", ".").split(separator)
  if (splitAtDecimal.length === 2) {
    const decimalPart = splitAtDecimal.at(-1)
    if (decimalPart !== undefined && decimalPart.length > 0) {
      if (decimalPart.length > decimals) {
        numberString = numberString.slice(0, decimals - decimalPart.length)
      }
    }
  }
  if (padDecimals) {
    splitAtDecimal = numberString.replace(",", ".").split(separator)
    if (splitAtDecimal.length !== 2) {
      numberString += "." + "0".repeat(decimals)
    } else {
      const decimalPart = splitAtDecimal.at(-1)
      if (decimalPart !== undefined && decimalPart.length < decimals) {
        numberString += "0".repeat(decimals - decimalPart.length)
      }
    }
  }
  return numberString
}

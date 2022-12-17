export function balanceCommas(amount: number) {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 1 })
}

const getDecimalsNeeded = (amount: number | string) => {
  amount = Number (amount)
  if (amount > 99999) {
    return 0
  } else if (amount > 9999) {
    return 1
  } else if (amount > 999) {
    return 2
  } else if (amount > 99) {
    return 3
  } else if (amount > 9) {
    return 4
  } else if (amount > 1) {
    return 5
  } else {
    return 6
  }
}

export function prettyBalance(balance: number | string, decimals: number = getDecimalsNeeded(balance)) {
  const truncattedAmount = truncateDecimals(balance.toString(), decimals, false)
  if (truncattedAmount === "0") { return "0.0" }
  return balanceCommas(Number(truncattedAmount))
}

export function prettyBalanceUSD(balance: number) {
  const truncattedAmount = truncateDecimals(balance.toString(), 2, true)
  if (truncattedAmount === "0") { return "0.0" }
  return balanceCommas(Number(truncattedAmount))
}

export function hideAddress(address: string, digits = 4) {
  return address.slice(0, 2 + digits) + "•••" + address.slice(-digits)
}

export function truncateDecimals(numberString: string, decimals: number, padDecimals: boolean = false) {
  let splitAtDecimal = numberString.replace(",", ".").split(".")
  if (splitAtDecimal.length == 1) {
    if (padDecimals) {
      return splitAtDecimal[0] + "." + "0".repeat(decimals)
    } else {
      return splitAtDecimal[0]
    }
  } 

  let decimalPart = splitAtDecimal.at(-1)
  if (decimalPart !== undefined && decimalPart.length > 0) {
    if (decimalPart.length > decimals) {
      decimalPart = decimalPart.slice(0, decimals - decimalPart.length)
    }
    if (padDecimals) {
      return splitAtDecimal[0] + "." + decimalPart + "0".repeat(decimals - decimalPart.length)
    } else {
      return splitAtDecimal[0] + "." + decimalPart
    }
  }

  return "0.0"
}

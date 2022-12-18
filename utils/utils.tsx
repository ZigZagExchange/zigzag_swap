export function balanceCommas(amount: number, decimals: number) {
  const formattedNumber = amount.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  let [integerString, decimalString] = formattedNumber.split('.')
  // only remove trailing zeros:
  while (decimalString && decimalString.at(-1) === '0') { decimalString = decimalString.substring(0, decimalString.length - 1) }
  decimalString = decimalString !== "" ? decimalString : '0'
  return integerString + "." + decimalString
}

const getDecimalsNeeded = (amount: number | string) => {
  amount = Number(amount)
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
  if (balance === 0) { return "0.0" }
  return balanceCommas(Number(balance), decimals)
}

export function prettyBalanceUSD(balance: number) {
  if (balance === 0) { return "0.0" }
  return balanceCommas(Number(balance), 2)
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
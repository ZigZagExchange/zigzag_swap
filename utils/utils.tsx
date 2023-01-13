import { ethers } from "ethers"

export function balanceCommas(amount: number, decimals: number) {
  const formattedNumber = amount.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return formattedNumber
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
  if (balance === 0 || Number(balance) === 0) {
    return "0.0"
  }
  return balanceCommas(Number(balance), decimals)
}

export function prettyBalanceUSD(balance: number) {
  if (balance === 0) {
    return "0.0"
  }
  return balanceCommas(Number(balance), 2)
}

export function hideAddress(address: string, digits = 4) {
  return address.slice(0, 2 + digits) + "•••" + address.slice(-digits)
}

export function truncateDecimals(numberString: string, decimals: number = getDecimalsNeeded(numberString), padDecimals: boolean = false) {
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
      decimalPart = decimalPart.slice(0, decimals)
    }

    if (decimalPart.length === 0) return splitAtDecimal[0]

    if (padDecimals) {
      return splitAtDecimal[0] + "." + decimalPart + "0".repeat(decimals - decimalPart.length)
    } else {
      return splitAtDecimal[0] + "." + decimalPart
    }
  }

  // this is probably "0."
  return numberString
}

export function getBigNumberFromInput(input: string, decimals: number): ethers.BigNumber {
  if (input === "" || input === ".") return ethers.constants.Zero
  try {
    const inputModified = truncateDecimals(input, decimals)
    return ethers.utils.parseUnits(inputModified, decimals)
  } catch (error) {
    return ethers.constants.Zero
  }
}

export function parseError(error: any) {
  if (error.hasOwnProperty("reason")) {
    const reason = error.reason.replace("execution reverted: ", "")

    switch (reason) {
      case "user rejected transaction":
        return "User rejected transaction."
      case "maker order not enough allowance":
        return "Tried to fill a bad quote, please try again."
      case "taker order not enough allowance":
        return "Insufficient balance."
      case "self swap not allowed":
        return "Self swap is not allowed."
      case "invalid maker signature":
        return "Tried to fill a bad quote, please try again."
      case "taker order not enough balance":
        return "Insufficient balance."
      case "maker order not enough balance":
        return "Tried to fill a bad quote, please try again."
      case "order is filled":
        return "Tried to fill a bad quote, please try again."
      case "order expired":
        return "Tried to fill a bad quote, please try again."
      case "order canceled":
        return "Tried to fill a bad quote, please try again."
      case "amount exceeds available size":
        return "Tried to fill a bad quote, please try again."
      case "ERC20: insufficient allowance":
        return "Insufficient allowance."
      case "ERC20: transfer amount exceeds balance":
        return "Insufficient balance."
      default:
        return error.reason
    }
  } else {
    if (error.hasOwnProperty("message")) return error.message
    else return "An unknown error has occurred."
  }
}

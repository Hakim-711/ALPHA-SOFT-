import type { PosCartLine, PosPaymentLine } from '../types/pos.types'

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function safeNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

export function nonNegativeNumber(value: unknown, fallback = 0) {
  return Math.max(0, safeNumber(value, fallback))
}

export function nonNegativeMoney(value: unknown, fallback = 0) {
  return roundMoney(nonNegativeNumber(value, fallback))
}

export function positiveNumber(value: unknown, fallback = 1) {
  const numberValue = safeNumber(value, fallback)
  return numberValue > 0 ? numberValue : fallback
}

export function discountPercent(value: unknown) {
  return Math.min(100, Math.max(0, safeNumber(value)))
}

export function lineGross(line: PosCartLine) {
  return nonNegativeNumber(line.qty) * nonNegativeMoney(line.rate)
}

export function lineDiscount(line: PosCartLine) {
  return lineGross(line) * (discountPercent(line.discountPercent) / 100)
}

export function lineTotal(line: PosCartLine) {
  return Math.max(0, lineGross(line) - lineDiscount(line))
}

export function calculateCartTotals(cart: PosCartLine[], invoiceDiscountAmount = 0) {
  const totalQuantity = roundMoney(cart.reduce((total, line) => total + nonNegativeNumber(line.qty), 0))
  const subtotal = roundMoney(cart.reduce((total, line) => total + lineGross(line), 0))
  const itemDiscountTotal = roundMoney(cart.reduce((total, line) => total + lineDiscount(line), 0))
  const netTotal = roundMoney(cart.reduce((total, line) => total + lineTotal(line), 0))
  const safeInvoiceDiscountAmount = Math.min(netTotal, nonNegativeMoney(invoiceDiscountAmount))
  const grandTotal = Math.max(0, roundMoney(netTotal - safeInvoiceDiscountAmount))

  return {
    totalQuantity,
    subtotal,
    itemDiscountTotal,
    netTotal,
    safeInvoiceDiscountAmount,
    grandTotal,
  }
}

export function calculatePaymentTotal(payments: PosPaymentLine[]) {
  return roundMoney(payments.reduce((total, payment) => total + nonNegativeMoney(payment.amount), 0))
}

export function buildPaymentsForGrandTotal(payments: PosPaymentLine[], grandTotal: number) {
  let remainingToApply = grandTotal

  return payments
    .filter((payment) => payment.mode_of_payment.trim() && nonNegativeMoney(payment.amount) > 0)
    .map((payment) => {
      const amount = Math.min(remainingToApply, nonNegativeMoney(payment.amount))
      remainingToApply = roundMoney(remainingToApply - amount)

      return {
        mode_of_payment: payment.mode_of_payment,
        account: payment.account,
        amount: roundMoney(amount),
        reference_no: payment.reference_no,
      }
    })
    .filter((payment) => payment.amount > 0)
}

export function findStockIssueLines(cart: PosCartLine[], updateStock: boolean) {
  if (!updateStock) {
    return []
  }

  return cart.filter(
    (line) =>
      line.isStockItem !== 0 &&
      typeof line.stockQty === 'number' &&
      Number.isFinite(line.stockQty) &&
      line.stockQty >= 0 &&
      nonNegativeNumber(line.qty) > line.stockQty,
  )
}

export function calculateExpression(expression: string) {
  const normalized = expression.replace(/\s/g, '')

  if (!normalized || /[^0-9+\-*/.]/.test(normalized)) {
    return null
  }

  const values = normalized.match(/\d+(?:\.\d+)?|[+\-*/]/g)

  if (!values || values.length === 0 || ['+', '-', '*', '/'].includes(values[values.length - 1])) {
    return null
  }

  const stack: Array<number | string> = []

  for (let index = 0; index < values.length; index += 1) {
    const token = values[index]

    if (token === '*' || token === '/') {
      const previous = Number(stack.pop())
      const next = Number(values[index + 1])

      if (!Number.isFinite(previous) || !Number.isFinite(next) || (token === '/' && next === 0)) {
        return null
      }

      stack.push(token === '*' ? previous * next : previous / next)
      index += 1
      continue
    }

    stack.push(['+', '-'].includes(token) ? token : Number(token))
  }

  let result = Number(stack[0])

  for (let index = 1; index < stack.length; index += 2) {
    const operator = stack[index]
    const next = Number(stack[index + 1])

    if (!Number.isFinite(result) || !Number.isFinite(next)) {
      return null
    }

    result = operator === '+' ? result + next : result - next
  }

  return roundMoney(result)
}

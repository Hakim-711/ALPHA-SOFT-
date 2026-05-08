import { http } from '@/core/api/http'
import type { FrappeDocResponse, FrappeListResponse } from '@/core/api/types'
import { getPosDefaults } from '@/features/pos/api/pos.api'
import { formatDateInputValue } from '@/shared/utils/date'
import type {
  CashShift,
  CashShiftDefaults,
  CashShiftListResult,
  CashShiftPaymentRow,
  CashShiftStatus,
  CashShiftSummary,
  CloseCashShiftValues,
  OpenCashShiftValues,
} from '../types/cash-shift.types'

interface FrappeMethodResponse<T> {
  message: T
}

interface PosInvoiceRow {
  name: string
  grand_total?: number
  paid_amount?: number
  currency?: string
  is_return?: 0 | 1
  return_against?: string
  owner?: string
  creation?: string
  posting_date?: string
  payments?: Array<{
    mode_of_payment?: string
    amount?: number
    base_amount?: number
  }>
}

interface PaymentEntryRow {
  name: string
  payment_type?: 'Receive' | 'Pay' | 'Internal Transfer'
  party_type?: 'Customer' | 'Supplier'
  party?: string
  mode_of_payment?: string
  received_amount?: number
  paid_amount?: number
  owner?: string
  creation?: string
  posting_date?: string
}

interface PosClosingEntryRow {
  name: string
  pos_opening_entry?: string
  docstatus?: 0 | 1 | 2
  status?: string
  period_end_date?: string
  posting_date?: string
  creation?: string
  modified?: string
}

const POS_OPENING_ENTRY = 'POS Opening Entry'
const POS_CLOSING_ENTRY = 'POS Closing Entry'

function cleanString(value?: string | null) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : undefined
}

function numberValue(value: unknown) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
}

function dateTimeValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function docstatusToStatus(docstatus?: number, rawStatus?: string): CashShiftStatus {
  const normalized = rawStatus?.toLowerCase()

  if (docstatus === 2 || normalized?.includes('cancel')) {
    return 'cancelled'
  }

  if (normalized?.includes('close') || normalized?.includes('closed')) {
    return 'closed'
  }

  if (docstatus === 0 || normalized?.includes('draft')) {
    return 'draft'
  }

  if (docstatus === 1) {
    return 'open'
  }

  return 'unknown'
}

function readString(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key]

    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return undefined
}

function normalizeBalanceDetails(row: Record<string, unknown>) {
  const rawRows = Array.isArray(row.balance_details)
    ? row.balance_details
    : Array.isArray(row.payment_methods)
      ? row.payment_methods
      : []

  return rawRows
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      mode_of_payment: readString(item, ['mode_of_payment', 'payment_method']) ?? 'نقدي',
      opening_amount: numberValue(item.opening_amount ?? item.amount ?? item.expected_amount),
    }))
}

function normalizeShift(row: Record<string, unknown>): CashShift {
  const rawStatus = readString(row, ['status', 'workflow_state'])
  const docstatus = numberValue(row.docstatus) as 0 | 1 | 2
  const balanceDetails = normalizeBalanceDetails(row)

  return {
    name: String(row.name ?? ''),
    pos_profile: readString(row, ['pos_profile', 'profile']),
    company: readString(row, ['company']),
    cashier: readString(row, ['cashier', 'user']),
    user: readString(row, ['user', 'cashier']),
    owner: readString(row, ['owner']),
    status: docstatusToStatus(docstatus, rawStatus),
    rawStatus,
    docstatus,
    period_start_date: readString(row, ['period_start_date', 'opening_time', 'from_time', 'creation']),
    period_end_date: readString(row, ['period_end_date', 'closing_time', 'to_time']),
    posting_date: readString(row, ['posting_date']),
    creation: readString(row, ['creation']),
    modified: readString(row, ['modified']),
    openingTotal: balanceDetails.reduce((sum, item) => sum + item.opening_amount, 0),
    balanceDetails,
  }
}

function shiftMatchesUser(shift: CashShift, user?: string) {
  if (!user) {
    return true
  }

  return [shift.cashier, shift.user, shift.owner].filter(Boolean).includes(user)
}

function shiftMatchesProfile(shift: CashShift, posProfile?: string) {
  return !posProfile || shift.pos_profile === posProfile
}

function rowDateFilter(start?: string, end?: string) {
  const filters: unknown[] = []

  if (start) {
    filters.push(['creation', '>=', start])
  }

  if (end) {
    filters.push(['creation', '<=', end])
  }

  return filters
}

function addAmount(
  bucket: Map<string, CashShiftPaymentRow>,
  mode: string,
  key: keyof Pick<
    CashShiftPaymentRow,
    'opening_amount' | 'sales_amount' | 'collection_amount' | 'disbursement_amount' | 'customer_refund_amount'
  >,
  amount: number,
) {
  const current =
    bucket.get(mode) ??
    ({
      mode_of_payment: mode,
      opening_amount: 0,
      sales_amount: 0,
      collection_amount: 0,
      disbursement_amount: 0,
      customer_refund_amount: 0,
      expected_amount: 0,
      counted_amount: 0,
      difference_amount: 0,
    } satisfies CashShiftPaymentRow)

  current[key] += amount
  bucket.set(mode, current)
}

async function listRecentSubmittedOpenings(limit = 50) {
  const response = await http.get<FrappeListResponse<Record<string, unknown>>>(`/resource/${encodeURIComponent(POS_OPENING_ENTRY)}`, {
    params: {
      fields: JSON.stringify(['*']),
      filters: JSON.stringify([[POS_OPENING_ENTRY, 'docstatus', '=', 1]]),
      limit_page_length: limit,
      order_by: 'modified desc',
    },
  })

  return applyClosingEntries(response.data.data.map(normalizeShift))
}

async function listSubmittedClosings(openingNames: string[]) {
  if (openingNames.length === 0) {
    return new Map<string, PosClosingEntryRow>()
  }

  const response = await http.get<FrappeListResponse<PosClosingEntryRow>>(`/resource/${encodeURIComponent(POS_CLOSING_ENTRY)}`, {
    params: {
      fields: JSON.stringify(['name', 'pos_opening_entry', 'docstatus', 'status', 'period_end_date', 'posting_date', 'creation', 'modified']),
      filters: JSON.stringify([
        [POS_CLOSING_ENTRY, 'docstatus', '=', 1],
        [POS_CLOSING_ENTRY, 'pos_opening_entry', 'in', openingNames],
      ]),
      limit_page_length: openingNames.length,
      order_by: 'modified desc',
    },
  })

  return new Map(
    response.data.data
      .filter((closing) => closing.pos_opening_entry)
      .map((closing) => [closing.pos_opening_entry as string, closing]),
  )
}

async function applyClosingEntries(shifts: CashShift[]) {
  const closingByOpening = await listSubmittedClosings(shifts.map((shift) => shift.name).filter(Boolean))

  return shifts.map((shift) => {
    const closing = closingByOpening.get(shift.name)

    if (!closing) {
      return shift
    }

    return {
      ...shift,
      status: 'closed' as const,
      closingEntry: closing.name,
      period_end_date: shift.period_end_date ?? closing.period_end_date ?? closing.creation,
      rawStatus: closing.status ?? shift.rawStatus ?? 'Closed',
    }
  })
}

export async function getCashShiftDefaults(): Promise<CashShiftDefaults> {
  return getPosDefaults()
}

export async function listCashShifts(params: { limit?: number; offset?: number; status?: 'open' | 'closed' | 'all' } = {}): Promise<CashShiftListResult> {
  const { limit = 20, offset = 0, status = 'all' } = params
  const filters: unknown[] = [[POS_OPENING_ENTRY, 'docstatus', '=', 1]]

  const response = await http.get<FrappeListResponse<Record<string, unknown>>>(`/resource/${encodeURIComponent(POS_OPENING_ENTRY)}`, {
    params: {
      fields: JSON.stringify(['*']),
      filters: JSON.stringify(filters),
      limit_start: offset,
      limit_page_length: limit + 1,
      order_by: 'modified desc',
    },
  })

  const allRows = await applyClosingEntries(response.data.data.map(normalizeShift))
  const rows = allRows.filter((row) => {
    if (status === 'open') {
      return row.status === 'open'
    }

    if (status === 'closed') {
      return row.status === 'closed'
    }

    return true
  })

  return {
    rows: rows.slice(0, limit),
    hasNextPage: rows.length > limit,
  }
}

export async function getActiveCashShift(posProfile?: string, user?: string) {
  const shifts = await listRecentSubmittedOpenings()

  return (
    shifts.find((shift) => shift.status === 'open' && shiftMatchesProfile(shift, posProfile) && shiftMatchesUser(shift, user)) ??
    shifts.find((shift) => shift.status === 'open' && shiftMatchesUser(shift, user)) ??
    null
  )
}

export async function openCashShift(values: OpenCashShiftValues) {
  const now = new Date()
  const payload = {
    user: values.cashier,
    cashier: values.cashier,
    pos_profile: values.pos_profile,
    company: values.company,
    posting_date: formatDateInputValue(now),
    period_start_date: dateTimeValue(now),
    balance_details: values.openingRows
      .filter((row) => cleanString(row.mode_of_payment))
      .map((row) => ({
        doctype: 'POS Opening Entry Detail',
        mode_of_payment: row.mode_of_payment,
        opening_amount: numberValue(row.opening_amount),
      })),
  }

  const response = await http.post<FrappeDocResponse<Record<string, unknown>>>(`/resource/${encodeURIComponent(POS_OPENING_ENTRY)}`, payload)
  const submitted = await http.post<FrappeMethodResponse<Record<string, unknown>>>('/method/frappe.client.submit', {
    doc: JSON.stringify(response.data.data),
  })

  return normalizeShift(submitted.data.message)
}

async function listShiftSalesInvoices(shift: CashShift) {
  const filters: unknown[] = [
    ['Sales Invoice', 'docstatus', '=', 1],
    ['Sales Invoice', 'is_pos', '=', 1],
    ['Sales Invoice', 'is_return', '!=', 1],
    ...rowDateFilter(shift.period_start_date, shift.period_end_date),
  ]

  if (shift.company) {
    filters.push(['Sales Invoice', 'company', '=', shift.company])
  }

  if (shift.owner || shift.cashier || shift.user) {
    filters.push(['Sales Invoice', 'owner', '=', shift.owner ?? shift.cashier ?? shift.user])
  }

  const response = await http.get<FrappeListResponse<PosInvoiceRow>>('/resource/Sales Invoice', {
    params: {
      fields: JSON.stringify(['name', 'grand_total', 'paid_amount', 'currency', 'is_return', 'owner', 'creation', 'posting_date']),
      filters: JSON.stringify(filters),
      limit_page_length: 100,
      order_by: 'creation desc',
    },
  })

  return Promise.all(
    response.data.data.map(async (row) => {
      try {
        const detail = await http.get<FrappeDocResponse<PosInvoiceRow>>(`/resource/Sales Invoice/${encodeURIComponent(row.name)}`)
        return detail.data.data
      } catch {
        return row
      }
    }),
  )
}

async function listShiftReturnInvoices(shift: CashShift) {
  const filters: unknown[] = [
    ['Sales Invoice', 'docstatus', '=', 1],
    ['Sales Invoice', 'is_return', '=', 1],
    ...rowDateFilter(shift.period_start_date, shift.period_end_date),
  ]

  if (shift.company) {
    filters.push(['Sales Invoice', 'company', '=', shift.company])
  }

  if (shift.owner || shift.cashier || shift.user) {
    filters.push(['Sales Invoice', 'owner', '=', shift.owner ?? shift.cashier ?? shift.user])
  }

  const response = await http.get<FrappeListResponse<PosInvoiceRow>>('/resource/Sales Invoice', {
    params: {
      fields: JSON.stringify(['name', 'grand_total', 'paid_amount', 'currency', 'is_return', 'return_against', 'owner', 'creation', 'posting_date']),
      filters: JSON.stringify(filters),
      limit_page_length: 100,
      order_by: 'creation desc',
    },
  })

  return response.data.data
}

async function listShiftPaymentEntries(shift: CashShift) {
  const filters: unknown[] = [
    ['Payment Entry', 'docstatus', '=', 1],
    ['Payment Entry', 'payment_type', 'in', ['Receive', 'Pay']],
    ...rowDateFilter(shift.period_start_date, shift.period_end_date),
  ]

  if (shift.company) {
    filters.push(['Payment Entry', 'company', '=', shift.company])
  }

  if (shift.owner || shift.cashier || shift.user) {
    filters.push(['Payment Entry', 'owner', '=', shift.owner ?? shift.cashier ?? shift.user])
  }

  const response = await http.get<FrappeListResponse<PaymentEntryRow>>('/resource/Payment Entry', {
    params: {
      fields: JSON.stringify([
        'name',
        'payment_type',
        'party_type',
        'party',
        'mode_of_payment',
        'received_amount',
        'paid_amount',
        'owner',
        'creation',
        'posting_date',
      ]),
      filters: JSON.stringify(filters),
      limit_page_length: 200,
      order_by: 'creation desc',
    },
  })

  return response.data.data
}

export async function getCashShiftSummary(shift: CashShift): Promise<CashShiftSummary> {
  const [invoices, returnInvoices, paymentEntries] = await Promise.all([
    listShiftSalesInvoices(shift),
    listShiftReturnInvoices(shift),
    listShiftPaymentEntries(shift),
  ])
  const buckets = new Map<string, CashShiftPaymentRow>()

  for (const row of shift.balanceDetails) {
    addAmount(buckets, row.mode_of_payment || 'نقدي', 'opening_amount', row.opening_amount)
  }

  for (const invoice of invoices) {
    const payments = Array.isArray(invoice.payments) ? invoice.payments : []

    if (payments.length === 0) {
      addAmount(buckets, 'نقدي', 'sales_amount', numberValue(invoice.paid_amount ?? invoice.grand_total))
      continue
    }

    for (const payment of payments) {
      addAmount(buckets, payment.mode_of_payment || 'نقدي', 'sales_amount', numberValue(payment.amount ?? payment.base_amount))
    }
  }

  for (const payment of paymentEntries) {
    const mode = payment.mode_of_payment || 'نقدي'

    if (payment.payment_type === 'Receive') {
      addAmount(buckets, mode, 'collection_amount', numberValue(payment.received_amount ?? payment.paid_amount))
    }

    if (payment.payment_type === 'Pay' && payment.party_type === 'Customer') {
      addAmount(buckets, mode, 'customer_refund_amount', numberValue(payment.paid_amount ?? payment.received_amount))
    }

    if (payment.payment_type === 'Pay' && payment.party_type !== 'Customer') {
      addAmount(buckets, mode, 'disbursement_amount', numberValue(payment.paid_amount ?? payment.received_amount))
    }
  }

  const paymentRows = [...buckets.values()]
    .map((row) => {
      const expected = row.opening_amount + row.sales_amount + row.collection_amount - row.disbursement_amount - row.customer_refund_amount

      return {
        ...row,
        expected_amount: expected,
        counted_amount: expected,
        difference_amount: 0,
      }
    })
    .sort((first, second) => second.expected_amount - first.expected_amount)

  const openingTotal = paymentRows.reduce((sum, row) => sum + row.opening_amount, 0)
  const salesTotal = paymentRows.reduce((sum, row) => sum + row.sales_amount, 0)
  const returnsTotal = returnInvoices.reduce((sum, row) => sum + Math.abs(numberValue(row.grand_total)), 0)
  const collectionsTotal = paymentRows.reduce((sum, row) => sum + row.collection_amount, 0)
  const disbursementsTotal = paymentRows.reduce((sum, row) => sum + row.disbursement_amount, 0)
  const customerRefundsTotal = paymentRows.reduce((sum, row) => sum + row.customer_refund_amount, 0)

  return {
    shift,
    openingTotal,
    salesTotal,
    returnsTotal,
    collectionsTotal,
    disbursementsTotal,
    customerRefundsTotal,
    expectedTotal: openingTotal + salesTotal + collectionsTotal - disbursementsTotal - customerRefundsTotal,
    invoicesCount: invoices.length,
    returnsCount: returnInvoices.length,
    collectionsCount: paymentEntries.filter((payment) => payment.payment_type === 'Receive').length,
    disbursementsCount: paymentEntries.filter((payment) => payment.payment_type === 'Pay' && payment.party_type !== 'Customer').length,
    customerRefundsCount: paymentEntries.filter((payment) => payment.payment_type === 'Pay' && payment.party_type === 'Customer').length,
    lastSyncedAt: new Date().toISOString(),
    paymentRows,
  }
}

export async function closeCashShift(values: CloseCashShiftValues) {
  const existingClosing = (await listSubmittedClosings([values.shift.name])).get(values.shift.name)

  if (existingClosing) {
    throw new Error(`هذه الوردية مغلقة مسبقًا عبر مستند الإغلاق ${existingClosing.name}.`)
  }

  const now = new Date()
  const countedByMode = new Map(values.countedRows.map((row) => [row.mode_of_payment, numberValue(row.counted_amount)]))
  const reconciliationRows = values.summary.paymentRows.map((row) => {
    const countedAmount = countedByMode.get(row.mode_of_payment) ?? 0

    return {
      doctype: 'POS Closing Entry Detail',
      mode_of_payment: row.mode_of_payment,
      opening_amount: row.opening_amount,
      expected_amount: row.expected_amount,
      closing_amount: countedAmount,
      difference: countedAmount - row.expected_amount,
    }
  })

  const payload = {
    pos_opening_entry: values.shift.name,
    user: values.shift.user ?? values.shift.cashier,
    cashier: values.shift.cashier ?? values.shift.user,
    pos_profile: values.shift.pos_profile,
    company: values.shift.company,
    posting_date: formatDateInputValue(now),
    period_end_date: dateTimeValue(now),
    remarks: cleanString(values.notes),
    payment_reconciliation: reconciliationRows,
  }

  const response = await http.post<FrappeDocResponse<Record<string, unknown>>>(`/resource/${encodeURIComponent(POS_CLOSING_ENTRY)}`, payload)
  const submitted = await http.post<FrappeMethodResponse<Record<string, unknown>>>('/method/frappe.client.submit', {
    doc: JSON.stringify(response.data.data),
  })

  return submitted.data.message
}

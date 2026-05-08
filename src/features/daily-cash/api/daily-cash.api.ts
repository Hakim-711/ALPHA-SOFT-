import { http } from '@/core/api/http'
import type { FrappeListResponse } from '@/core/api/types'
import type {
  DailyCashAccountOption,
  DailyCashCompanyOption,
  DailyCashDefaults,
  DailyCashFilters,
  DailyCashMovement,
  DailyCashReport,
} from '../types/daily-cash.types'

interface PaymentEntryRow {
  name: string
  posting_date: string
  company: string
  party?: string
  party_name?: string
  paid_from?: string
  paid_to?: string
  paid_from_account_currency?: string
  paid_to_account_currency?: string
  paid_amount: number
  received_amount: number
  payment_type: 'Receive' | 'Pay' | 'Internal Transfer'
  mode_of_payment?: string
  reference_no?: string
  remarks?: string
  modified?: string
}

interface SalesInvoiceCashRow {
  name: string
  posting_date: string
  company: string
  customer?: string
  is_pos?: 0 | 1
  grand_total: number
  debit_to?: string
  currency?: string
  status?: string
  modified?: string
}

interface GlEntryRow {
  name: string
  posting_date: string
  account: string
  account_currency?: string
  debit_in_account_currency?: number
  credit_in_account_currency?: number
  voucher_type?: string
  voucher_no?: string
}

function roundAmount(value: number) {
  return Math.round(value * 100) / 100
}

function compareDatesDesc(first?: string, second?: string) {
  return String(second ?? '').localeCompare(String(first ?? ''))
}

function maxDate(values: Array<string | undefined>) {
  return values
    .filter((value): value is string => Boolean(value))
    .sort((first, second) => compareDatesDesc(first, second))[0]
}

async function fetchAllRows<T>(doctype: string, options: { fields: string[]; filters?: unknown[]; orFilters?: unknown[]; orderBy?: string }) {
  const rows: T[] = []
  const limit = 500
  let offset = 0

  for (let page = 0; page < 20; page += 1) {
    const response = await http.get<FrappeListResponse<T>>(`/resource/${encodeURIComponent(doctype)}`, {
      params: {
        fields: JSON.stringify(options.fields),
        filters: JSON.stringify(options.filters ?? []),
        ...(options.orFilters?.length ? { or_filters: JSON.stringify(options.orFilters) } : {}),
        limit_start: offset,
        limit_page_length: limit,
        order_by: options.orderBy ?? 'modified desc',
      },
    })

    const chunk = response.data.data
    rows.push(...chunk)

    if (chunk.length < limit) {
      break
    }

    offset += limit
  }

  return rows
}

async function listCashAccounts(company?: string) {
  const filters: unknown[] = [
    ['Account', 'account_type', 'in', ['Bank', 'Cash']],
    ['Account', 'is_group', '=', 0],
    ['Account', 'disabled', '=', 0],
  ]

  if (company?.trim()) {
    filters.push(['Account', 'company', '=', company.trim()])
  }

  const response = await http.get<FrappeListResponse<DailyCashAccountOption>>('/resource/Account', {
    params: {
      fields: JSON.stringify(['name', 'company', 'account_type', 'account_currency']),
      filters: JSON.stringify(filters),
      order_by: 'name asc',
      limit_page_length: 200,
    },
  })

  return response.data.data
}

function paymentEntryFields() {
  return [
    'name',
    'posting_date',
    'company',
    'party',
    'party_name',
    'paid_from',
    'paid_to',
    'paid_from_account_currency',
    'paid_to_account_currency',
    'paid_amount',
    'received_amount',
    'payment_type',
    'mode_of_payment',
    'reference_no',
    'remarks',
    'modified',
  ]
}

function glEntryFields() {
  return [
    'name',
    'posting_date',
    'account',
    'account_currency',
    'debit_in_account_currency',
    'credit_in_account_currency',
    'voucher_type',
    'voucher_no',
  ]
}

export async function getDailyCashDefaults(): Promise<DailyCashDefaults> {
  const [companiesResponse, accounts, latestPaymentEntriesResponse, latestPosSalesResponse] = await Promise.all([
    http.get<FrappeListResponse<DailyCashCompanyOption>>('/resource/Company', {
      params: {
        fields: JSON.stringify(['name', 'default_currency', 'default_cash_account', 'default_bank_account']),
        limit_page_length: 50,
        order_by: 'modified desc',
      },
    }),
    listCashAccounts(),
    http.get<FrappeListResponse<{ posting_date: string }>>('/resource/Payment Entry', {
      params: {
        fields: JSON.stringify(['posting_date']),
        filters: JSON.stringify([
          ['Payment Entry', 'docstatus', '=', 1],
          ['Payment Entry', 'payment_type', 'in', ['Receive', 'Pay', 'Internal Transfer']],
        ]),
        limit_page_length: 1,
        order_by: 'posting_date desc',
      },
    }),
    http.get<FrappeListResponse<{ posting_date: string }>>('/resource/Sales Invoice', {
      params: {
        fields: JSON.stringify(['posting_date']),
        filters: JSON.stringify([
          ['Sales Invoice', 'docstatus', '=', 1],
          ['Sales Invoice', 'is_pos', '=', 1],
        ]),
        limit_page_length: 1,
        order_by: 'posting_date desc',
      },
    }),
  ])

  return {
    companies: companiesResponse.data.data,
    accounts,
    latestPostingDate: maxDate([
      latestPaymentEntriesResponse.data.data[0]?.posting_date,
      latestPosSalesResponse.data.data[0]?.posting_date,
    ]),
  }
}

function buildAccountMatch(field: 'paid_to' | 'paid_from' | 'debit_to' | 'account', account: string) {
  return [field === 'account' ? 'GL Entry' : field === 'debit_to' ? 'Sales Invoice' : 'Payment Entry', field, '=', account]
}

function toMovementDateValue(value?: string) {
  return value ?? ''
}

export async function getDailyCashReport(filters: DailyCashFilters): Promise<DailyCashReport> {
  const company = filters.company.trim()
  const accountName = filters.account.trim()
  const date = filters.date

  const [companiesResponse, accounts] = await Promise.all([
    http.get<FrappeListResponse<DailyCashCompanyOption>>('/resource/Company', {
      params: {
        fields: JSON.stringify(['name', 'default_currency', 'default_cash_account', 'default_bank_account']),
        filters: JSON.stringify([['Company', 'name', '=', company]]),
        limit_page_length: 1,
      },
    }),
    listCashAccounts(company),
  ])

  const companyRow = companiesResponse.data.data[0]
  const selectedAccount = accounts.find((account) => account.name === accountName)

  if (!selectedAccount) {
    throw new Error('تعذر العثور على الحساب النقدي المحدد لهذه الشركة.')
  }

  const [glEntriesBefore, glEntriesToday, collections, disbursements, customerRefunds, transfers, posSales] = await Promise.all([
    fetchAllRows<GlEntryRow>('GL Entry', {
      fields: glEntryFields(),
      filters: [
        ['GL Entry', 'company', '=', company],
        ['GL Entry', 'account', '=', selectedAccount.name],
        ['GL Entry', 'is_cancelled', '=', 0],
        ['GL Entry', 'posting_date', '<', date],
      ],
      orderBy: 'posting_date asc, creation asc',
    }),
    fetchAllRows<GlEntryRow>('GL Entry', {
      fields: glEntryFields(),
      filters: [
        ['GL Entry', 'company', '=', company],
        ['GL Entry', 'account', '=', selectedAccount.name],
        ['GL Entry', 'is_cancelled', '=', 0],
        ['GL Entry', 'posting_date', '=', date],
      ],
      orderBy: 'posting_date asc, creation asc',
    }),
    fetchAllRows<PaymentEntryRow>('Payment Entry', {
      fields: paymentEntryFields(),
      filters: [
        ['Payment Entry', 'docstatus', '=', 1],
        ['Payment Entry', 'payment_type', '=', 'Receive'],
        ['Payment Entry', 'party_type', '=', 'Customer'],
        ['Payment Entry', 'company', '=', company],
        ['Payment Entry', 'posting_date', '=', date],
        buildAccountMatch('paid_to', selectedAccount.name),
      ],
      orderBy: 'posting_date desc, modified desc',
    }),
    fetchAllRows<PaymentEntryRow>('Payment Entry', {
      fields: paymentEntryFields(),
      filters: [
        ['Payment Entry', 'docstatus', '=', 1],
        ['Payment Entry', 'payment_type', '=', 'Pay'],
        ['Payment Entry', 'party_type', '=', 'Supplier'],
        ['Payment Entry', 'company', '=', company],
        ['Payment Entry', 'posting_date', '=', date],
        buildAccountMatch('paid_from', selectedAccount.name),
      ],
      orderBy: 'posting_date desc, modified desc',
    }),
    fetchAllRows<PaymentEntryRow>('Payment Entry', {
      fields: paymentEntryFields(),
      filters: [
        ['Payment Entry', 'docstatus', '=', 1],
        ['Payment Entry', 'payment_type', '=', 'Pay'],
        ['Payment Entry', 'party_type', '=', 'Customer'],
        ['Payment Entry', 'company', '=', company],
        ['Payment Entry', 'posting_date', '=', date],
        buildAccountMatch('paid_from', selectedAccount.name),
      ],
      orderBy: 'posting_date desc, modified desc',
    }),
    fetchAllRows<PaymentEntryRow>('Payment Entry', {
      fields: paymentEntryFields(),
      filters: [
        ['Payment Entry', 'docstatus', '=', 1],
        ['Payment Entry', 'payment_type', '=', 'Internal Transfer'],
        ['Payment Entry', 'company', '=', company],
        ['Payment Entry', 'posting_date', '=', date],
      ],
      orFilters: [
        ['Payment Entry', 'paid_from', '=', selectedAccount.name],
        ['Payment Entry', 'paid_to', '=', selectedAccount.name],
      ],
      orderBy: 'posting_date desc, modified desc',
    }),
    fetchAllRows<SalesInvoiceCashRow>('Sales Invoice', {
      fields: ['name', 'posting_date', 'company', 'customer', 'is_pos', 'grand_total', 'debit_to', 'currency', 'status', 'modified'],
      filters: [
        ['Sales Invoice', 'docstatus', '=', 1],
        ['Sales Invoice', 'is_pos', '=', 1],
        ['Sales Invoice', 'company', '=', company],
        ['Sales Invoice', 'posting_date', '=', date],
        buildAccountMatch('debit_to', selectedAccount.name),
      ],
      orderBy: 'posting_date desc, modified desc',
    }),
  ])

  const openingBalance = roundAmount(
    glEntriesBefore.reduce(
      (sum, row) => sum + (row.debit_in_account_currency ?? 0) - (row.credit_in_account_currency ?? 0),
      0,
    ),
  )
  const ledgerNetMovement = roundAmount(
    glEntriesToday.reduce(
      (sum, row) => sum + (row.debit_in_account_currency ?? 0) - (row.credit_in_account_currency ?? 0),
      0,
    ),
  )
  const ledgerClosingBalance = roundAmount(openingBalance + ledgerNetMovement)

  const collectionsTotal = roundAmount(collections.reduce((sum, row) => sum + (row.received_amount ?? 0), 0))
  const disbursementsTotal = roundAmount(disbursements.reduce((sum, row) => sum + (row.paid_amount ?? 0), 0))
  const customerRefundsTotal = roundAmount(customerRefunds.reduce((sum, row) => sum + (row.paid_amount ?? 0), 0))
  const posSalesTotal = roundAmount(posSales.reduce((sum, row) => sum + (row.grand_total ?? 0), 0))
  const transferInRows = transfers.filter((row) => row.paid_to === selectedAccount.name)
  const transferOutRows = transfers.filter((row) => row.paid_from === selectedAccount.name)
  const transferInTotal = roundAmount(transferInRows.reduce((sum, row) => sum + (row.received_amount ?? 0), 0))
  const transferOutTotal = roundAmount(transferOutRows.reduce((sum, row) => sum + (row.paid_amount ?? 0), 0))
  const incomingTotal = roundAmount(collectionsTotal + posSalesTotal + transferInTotal)
  const outgoingTotal = roundAmount(disbursementsTotal + customerRefundsTotal + transferOutTotal)
  const netMovement = roundAmount(incomingTotal - outgoingTotal)
  const expectedClosingBalance = roundAmount(openingBalance + netMovement)
  const reconciliationGap = roundAmount(ledgerClosingBalance - expectedClosingBalance)

  const movementRows: DailyCashMovement[] = [
    ...collections.map((row) => ({
      id: `collection-${row.name}`,
      type: 'collection' as const,
      label: 'تحصيل',
      reference: row.name,
      postingDate: row.posting_date,
      party: row.party_name || row.party,
      account: row.paid_to || selectedAccount.name,
      counterAccount: row.paid_from,
      currency: row.paid_to_account_currency || selectedAccount.account_currency,
      amount: row.received_amount ?? 0,
      netAmount: row.received_amount ?? 0,
      note: row.mode_of_payment || row.reference_no || row.remarks,
      path: `/collections/${encodeURIComponent(row.name)}`,
    })),
    ...disbursements.map((row) => ({
      id: `disbursement-${row.name}`,
      type: 'disbursement' as const,
      label: 'صرف',
      reference: row.name,
      postingDate: row.posting_date,
      party: row.party_name || row.party,
      account: row.paid_from || selectedAccount.name,
      counterAccount: row.paid_to,
      currency: row.paid_from_account_currency || selectedAccount.account_currency,
      amount: row.paid_amount ?? 0,
      netAmount: -Math.abs(row.paid_amount ?? 0),
      note: row.mode_of_payment || row.reference_no || row.remarks,
      path: `/disbursements/${encodeURIComponent(row.name)}`,
    })),
    ...customerRefunds.map((row) => ({
      id: `customer-refund-${row.name}`,
      type: 'customer-refund' as const,
      label: 'استرداد عميل',
      reference: row.name,
      postingDate: row.posting_date,
      party: row.party_name || row.party,
      account: row.paid_from || selectedAccount.name,
      counterAccount: row.paid_to,
      currency: row.paid_from_account_currency || selectedAccount.account_currency,
      amount: row.paid_amount ?? 0,
      netAmount: -Math.abs(row.paid_amount ?? 0),
      note: row.mode_of_payment || row.reference_no || row.remarks || 'استرداد مرتجع نقطة بيع',
    })),
    ...posSales.map((row) => ({
      id: `pos-${row.name}`,
      type: 'pos-sale' as const,
      label: 'بيع نقدي',
      reference: row.name,
      postingDate: row.posting_date,
      party: row.customer,
      account: row.debit_to || selectedAccount.name,
      currency: row.currency || selectedAccount.account_currency,
      amount: row.grand_total ?? 0,
      netAmount: row.grand_total ?? 0,
      note: row.status || 'فاتورة نقاط بيع',
      path: `/sales-invoices/${encodeURIComponent(row.name)}`,
    })),
    ...transferInRows.map((row) => ({
      id: `transfer-in-${row.name}`,
      type: 'transfer-in' as const,
      label: 'تحويل وارد',
      reference: row.name,
      postingDate: row.posting_date,
      account: row.paid_to || selectedAccount.name,
      counterAccount: row.paid_from,
      currency: row.paid_to_account_currency || selectedAccount.account_currency,
      amount: row.received_amount ?? 0,
      netAmount: row.received_amount ?? 0,
      note: row.mode_of_payment || row.reference_no || 'تحويل داخلي',
    })),
    ...transferOutRows.map((row) => ({
      id: `transfer-out-${row.name}`,
      type: 'transfer-out' as const,
      label: 'تحويل صادر',
      reference: row.name,
      postingDate: row.posting_date,
      account: row.paid_from || selectedAccount.name,
      counterAccount: row.paid_to,
      currency: row.paid_from_account_currency || selectedAccount.account_currency,
      amount: row.paid_amount ?? 0,
      netAmount: -Math.abs(row.paid_amount ?? 0),
      note: row.mode_of_payment || row.reference_no || 'تحويل داخلي',
    })),
  ].sort((first, second) => compareDatesDesc(toMovementDateValue(first.postingDate), toMovementDateValue(second.postingDate)))

  const transferRows: DailyCashMovement[] = [
    ...transferInRows.map((row) => ({
      id: `transfer-card-in-${row.name}`,
      type: 'transfer-in' as const,
      label: 'تحويل وارد',
      reference: row.name,
      postingDate: row.posting_date,
      account: row.paid_to || selectedAccount.name,
      counterAccount: row.paid_from,
      currency: row.paid_to_account_currency || selectedAccount.account_currency,
      amount: row.received_amount ?? 0,
      netAmount: row.received_amount ?? 0,
      note: row.mode_of_payment || row.reference_no || 'تحويل داخلي',
    })),
    ...transferOutRows.map((row) => ({
      id: `transfer-card-out-${row.name}`,
      type: 'transfer-out' as const,
      label: 'تحويل صادر',
      reference: row.name,
      postingDate: row.posting_date,
      account: row.paid_from || selectedAccount.name,
      counterAccount: row.paid_to,
      currency: row.paid_from_account_currency || selectedAccount.account_currency,
      amount: row.paid_amount ?? 0,
      netAmount: -Math.abs(row.paid_amount ?? 0),
      note: row.mode_of_payment || row.reference_no || 'تحويل داخلي',
    })),
  ].sort((first, second) => compareDatesDesc(first.postingDate, second.postingDate))

  const lastSyncedAt = maxDate([
    ...collections.map((row) => row.modified),
    ...disbursements.map((row) => row.modified),
    ...customerRefunds.map((row) => row.modified),
    ...posSales.map((row) => row.modified),
    ...transfers.map((row) => row.modified),
  ]) ?? new Date().toISOString()

  return {
    filters: { date, company, account: selectedAccount.name },
    selectedAccount,
    companyCurrency: companyRow?.default_currency,
    openingBalance,
    incomingTotal,
    outgoingTotal,
    netMovement,
    expectedClosingBalance,
    ledgerClosingBalance,
    ledgerNetMovement,
    reconciliationGap,
    collectionsTotal,
    disbursementsTotal,
    customerRefundsTotal,
    posSalesTotal,
    transferInTotal,
    transferOutTotal,
    collectionsCount: collections.length,
    disbursementsCount: disbursements.length,
    customerRefundsCount: customerRefunds.length,
    posSalesCount: posSales.length,
    transfersCount: transfers.length,
    movements: movementRows,
    transfers: transferRows,
    lastSyncedAt,
  }
}

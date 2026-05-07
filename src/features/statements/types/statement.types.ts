export type StatementPartyType = 'Customer' | 'Supplier'

export interface StatementCompanyOption {
  name: string
  default_currency?: string
}

export interface StatementGlEntry {
  name: string
  posting_date?: string
  account?: string
  account_currency?: string
  company?: string
  party_type?: string
  party?: string
  debit?: number
  credit?: number
  debit_in_account_currency?: number
  credit_in_account_currency?: number
  voucher_type?: string
  voucher_no?: string
  against?: string
  remarks?: string
  creation?: string
  is_cancelled?: 0 | 1
}

export interface StatementRow {
  id: string
  postingDate: string
  account: string
  currency: string
  debit: number
  credit: number
  runningBalance: number
  voucherType: string
  voucherNo: string
  against?: string
  remarks?: string
  creation?: string
}

export interface StatementCurrencySummary {
  currency: string
  openingBalance: number
  debit: number
  credit: number
  closingBalance: number
  entries: number
}

export interface StatementOutstandingDocument {
  name: string
  posting_date?: string
  due_date?: string
  currency?: string
  grand_total?: number
  outstanding_amount?: number
  status?: string
}

export interface StatementResult {
  partyType: StatementPartyType
  party: string
  company?: string
  fromDate: string
  toDate: string
  rows: StatementRow[]
  summaries: StatementCurrencySummary[]
  outstandingDocuments: StatementOutstandingDocument[]
  lastSyncedAt: string
}

export interface StatementFilters {
  partyType: StatementPartyType
  party: string
  company?: string
  fromDate: string
  toDate: string
}

import type { PosDefaults } from '@/features/pos/types/pos.types'

export type CashShiftStatus = 'open' | 'closed' | 'draft' | 'cancelled' | 'unknown'

export interface CashShiftPaymentRow {
  mode_of_payment: string
  opening_amount: number
  sales_amount: number
  collection_amount: number
  disbursement_amount: number
  customer_refund_amount: number
  expected_amount: number
  counted_amount: number
  difference_amount: number
}

export interface CashShift {
  name: string
  pos_profile?: string
  company?: string
  cashier?: string
  user?: string
  owner?: string
  status: CashShiftStatus
  rawStatus?: string
  docstatus?: 0 | 1 | 2
  closingEntry?: string
  period_start_date?: string
  period_end_date?: string
  posting_date?: string
  creation?: string
  modified?: string
  openingTotal: number
  balanceDetails: Array<{
    mode_of_payment: string
    opening_amount: number
  }>
}

export type CashShiftDefaults = PosDefaults

export interface CashShiftListResult {
  rows: CashShift[]
  hasNextPage: boolean
}

export interface CashShiftSummary {
  shift: CashShift
  openingTotal: number
  salesTotal: number
  returnsTotal: number
  collectionsTotal: number
  disbursementsTotal: number
  customerRefundsTotal: number
  expectedTotal: number
  invoicesCount: number
  returnsCount: number
  collectionsCount: number
  disbursementsCount: number
  customerRefundsCount: number
  lastSyncedAt: string
  paymentRows: CashShiftPaymentRow[]
}

export interface OpenCashShiftValues {
  pos_profile: string
  company: string
  cashier: string
  openingRows: Array<{
    mode_of_payment: string
    opening_amount: number
  }>
}

export interface CloseCashShiftValues {
  shift: CashShift
  summary: CashShiftSummary
  countedRows: Array<{
    mode_of_payment: string
    counted_amount: number
  }>
  notes?: string
}

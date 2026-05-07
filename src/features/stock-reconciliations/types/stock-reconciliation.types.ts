export type StockReconciliationPurpose = 'Opening Stock' | 'Stock Reconciliation'

export interface StockReconciliationItem {
  name?: string
  item_code: string
  item_name?: string
  warehouse: string
  qty?: number
  valuation_rate?: number
  amount?: number
  current_qty?: number
  current_valuation_rate?: number
  current_amount?: number
  batch_no?: string
  serial_and_batch_bundle?: string
}

export interface StockReconciliation {
  name: string
  naming_series?: string
  company: string
  posting_date: string
  posting_time: string
  purpose: StockReconciliationPurpose
  set_posting_time?: 0 | 1
  expense_account?: string
  cost_center?: string
  remarks?: string
  docstatus?: 0 | 1 | 2
  owner?: string
  creation?: string
  modified?: string
  items: StockReconciliationItem[]
}

export interface StockReconciliationFormItem {
  item_code: string
  item_name?: string
  warehouse: string
  qty: number
  valuation_rate?: number
  current_qty?: number
  current_valuation_rate?: number
  current_amount?: number
  batch_no?: string
  serial_and_batch_bundle?: string
}

export interface StockReconciliationFormValues {
  naming_series: string
  company: string
  posting_date: string
  posting_time: string
  purpose: StockReconciliationPurpose
  set_posting_time: boolean
  expense_account?: string
  cost_center?: string
  remarks?: string
  items: StockReconciliationFormItem[]
}

export interface StockReconciliationListResult {
  rows: StockReconciliation[]
  hasNextPage: boolean
}

export interface StockReconciliationCompanyOption {
  name: string
  default_currency?: string
  stock_adjustment_account?: string
  cost_center?: string
}

export interface StockReconciliationDefaults {
  namingSeriesOptions: string[]
  companies: StockReconciliationCompanyOption[]
  purposeOptions: StockReconciliationPurpose[]
}

export interface StockBinSnapshot {
  item_code: string
  warehouse: string
  actual_qty?: number
  valuation_rate?: number
  stock_value?: number
}

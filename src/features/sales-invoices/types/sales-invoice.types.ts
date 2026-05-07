export interface SalesInvoiceItem {
  name?: string
  item_code: string
  item_name: string
  description?: string
  qty: number
  uom: string
  stock_uom?: string
  conversion_factor?: number
  rate?: number
  amount?: number
  warehouse?: string
  income_account?: string
  cost_center?: string
  sales_order?: string
}

export interface SalesInvoicePaymentSchedule {
  name?: string
  due_date?: string
  invoice_portion?: number
  payment_amount?: number
  outstanding?: number
  paid_amount?: number
}

export interface SalesInvoice {
  name: string
  customer: string
  customer_name?: string
  company: string
  posting_date: string
  due_date?: string
  currency: string
  conversion_rate?: number
  selling_price_list: string
  set_warehouse?: string
  debit_to?: string
  update_stock?: 0 | 1
  is_return?: 0 | 1
  return_against?: string | null
  remarks?: string
  status?: string
  docstatus?: 0 | 1 | 2
  grand_total?: number
  rounded_total?: number
  outstanding_amount?: number
  total?: number
  net_total?: number
  owner?: string
  creation?: string
  modified?: string
  items: SalesInvoiceItem[]
  payment_schedule: SalesInvoicePaymentSchedule[]
}

export interface SalesInvoiceFormItem {
  item_code: string
  item_name: string
  description?: string
  qty: number
  uom: string
  stock_uom?: string
  rate?: number
  warehouse?: string
}

export interface SalesInvoiceFormValues {
  customer: string
  company: string
  posting_date: string
  due_date?: string
  currency: string
  conversion_rate?: number
  selling_price_list: string
  set_warehouse?: string
  debit_to?: string
  update_stock?: boolean
  remarks?: string
  items: SalesInvoiceFormItem[]
}

export interface SalesInvoiceListResult {
  rows: SalesInvoice[]
  hasNextPage: boolean
}

export interface SalesInvoiceCompanyOption {
  name: string
  default_currency?: string
  default_receivable_account?: string
  default_cash_account?: string
  default_bank_account?: string
}

export interface SalesInvoiceAccountOption {
  name: string
  company: string
  account_type: 'Bank' | 'Cash' | 'Receivable'
  account_currency?: string
  disabled?: 0 | 1
  is_group?: 0 | 1
}

export interface SalesInvoiceDefaults {
  companies: SalesInvoiceCompanyOption[]
  priceLists: Array<{ name: string; currency?: string; selling?: 0 | 1 }>
  receivableAccounts: SalesInvoiceAccountOption[]
}

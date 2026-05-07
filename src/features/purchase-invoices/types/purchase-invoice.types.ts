export interface PurchaseInvoiceItem {
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
  expense_account?: string
  cost_center?: string
  purchase_order?: string
}

export interface PurchaseInvoicePaymentSchedule {
  name?: string
  due_date?: string
  invoice_portion?: number
  payment_amount?: number
  outstanding?: number
  paid_amount?: number
}

export interface PurchaseInvoice {
  name: string
  supplier: string
  supplier_name?: string
  company: string
  posting_date: string
  due_date?: string
  currency: string
  conversion_rate?: number
  buying_price_list: string
  set_warehouse?: string
  credit_to?: string
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
  items: PurchaseInvoiceItem[]
  payment_schedule: PurchaseInvoicePaymentSchedule[]
}

export interface PurchaseInvoiceFormItem {
  item_code: string
  item_name: string
  description?: string
  qty: number
  uom: string
  stock_uom?: string
  rate?: number
  warehouse?: string
  purchase_order?: string
}

export interface PurchaseInvoiceFormValues {
  supplier: string
  company: string
  posting_date: string
  due_date?: string
  currency: string
  conversion_rate?: number
  buying_price_list: string
  set_warehouse?: string
  credit_to?: string
  update_stock?: boolean
  remarks?: string
  items: PurchaseInvoiceFormItem[]
}

export interface PurchaseInvoiceListResult {
  rows: PurchaseInvoice[]
  hasNextPage: boolean
}

export interface PurchaseInvoiceCompanyOption {
  name: string
  default_currency?: string
  default_payable_account?: string
  default_cash_account?: string
  default_bank_account?: string
}

export interface PurchaseInvoiceAccountOption {
  name: string
  company: string
  account_type: 'Bank' | 'Cash' | 'Payable'
  account_currency?: string
  disabled?: 0 | 1
  is_group?: 0 | 1
}

export interface PurchaseInvoiceDefaults {
  companies: PurchaseInvoiceCompanyOption[]
  priceLists: Array<{ name: string; currency?: string; buying?: 0 | 1 }>
  payableAccounts: PurchaseInvoiceAccountOption[]
}

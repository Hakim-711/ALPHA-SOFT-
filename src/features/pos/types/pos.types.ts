import type { SalesInvoice } from '@/features/sales-invoices/types/sales-invoice.types'

export interface PosProfilePayment {
  mode_of_payment?: string
  account?: string
  default?: 0 | 1
}

export interface PosProfile {
  name: string
  company: string
  customer?: string
  warehouse?: string
  currency?: string
  selling_price_list?: string
  disabled?: 0 | 1
  payments?: PosProfilePayment[]
}

export interface PosCompanyOption {
  name: string
  default_currency?: string
  default_receivable_account?: string
  default_cash_account?: string
  default_bank_account?: string
}

export interface PosAccountOption {
  name: string
  company: string
  account_type?: 'Cash' | 'Bank' | 'Receivable'
  account_currency?: string
  disabled?: 0 | 1
  is_group?: 0 | 1
}

export interface PosPaymentModeOption {
  name: string
  type?: string
  enabled?: 0 | 1
}

export interface PosFilterOption {
  name: string
}

export interface PosDefaults {
  profiles: PosProfile[]
  companies: PosCompanyOption[]
  priceLists: Array<{ name: string; currency?: string; selling?: 0 | 1 }>
  warehouses: Array<{ name: string; company?: string }>
  paymentModes: PosPaymentModeOption[]
  paymentAccounts: PosAccountOption[]
  receivableAccounts: PosAccountOption[]
  itemGroups: PosFilterOption[]
  brands: PosFilterOption[]
}

export interface PosItemSearchResult {
  name: string
  item_code: string
  item_name: string
  item_group?: string
  stock_uom?: string
  barcode?: string
  brand?: string
  standard_rate?: number
  price_list_rate?: number
  actual_qty?: number
  disabled?: 0 | 1
  is_stock_item?: 0 | 1
  is_sales_item?: 0 | 1
}

export interface PosCartLine {
  id: string
  item_code: string
  item_name: string
  uom: string
  qty: number
  rate: number
  discountPercent: number
  warehouse?: string
  stockQty?: number
  isStockItem?: 0 | 1
}

export interface PosPaymentLine {
  mode_of_payment: string
  account?: string
  amount: number
  reference_no?: string
}

export interface PosPaymentDraftLine extends PosPaymentLine {
  id: string
}

export interface PosSalePayload {
  saleMode: 'cash' | 'credit' | 'partial'
  customer: string
  company: string
  posting_date: string
  due_date?: string
  currency: string
  conversion_rate: number
  selling_price_list: string
  set_warehouse?: string
  pos_profile?: string
  posOpeningEntry?: string
  receivableAccount?: string
  updateStock?: boolean
  invoiceDiscountAmount?: number
  paidAmount: number
  remarks?: string
  cart: PosCartLine[]
  payments: PosPaymentLine[]
}

export interface PosCompletedSale {
  invoice: SalesInvoice
  submittedInvoice: SalesInvoice
  collection?: {
    name: string
  }
  collections?: Array<{
    name: string
  }>
}

export interface HeldPosCart {
  id: string
  label: string
  createdAt: string
  customer: string
  saleMode?: 'cash' | 'credit' | 'partial'
  dueDate?: string
  currency?: string
  conversionRate?: number
  updateStock?: boolean
  cart: PosCartLine[]
  invoiceDiscountAmount: number
}

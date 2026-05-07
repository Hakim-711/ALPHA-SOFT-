export interface SalesOrderItem {
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
  delivery_date?: string
}

export interface SalesOrder {
  name: string
  customer: string
  company: string
  transaction_date: string
  delivery_date?: string
  currency: string
  selling_price_list: string
  set_warehouse?: string
  status?: string
  docstatus?: 0 | 1 | 2
  grand_total?: number
  rounded_total?: number
  per_delivered?: number
  per_billed?: number
  owner?: string
  creation?: string
  modified?: string
  items: SalesOrderItem[]
}

export interface SalesOrderFormItem {
  item_code: string
  item_name: string
  description?: string
  qty: number
  uom: string
  stock_uom?: string
  rate?: number
  warehouse?: string
  delivery_date?: string
}

export interface SalesOrderFormValues {
  customer: string
  company: string
  transaction_date: string
  delivery_date?: string
  currency: string
  selling_price_list: string
  set_warehouse?: string
  items: SalesOrderFormItem[]
}

export interface SalesOrderListResult {
  rows: SalesOrder[]
  hasNextPage: boolean
}

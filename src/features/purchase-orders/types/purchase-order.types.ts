export interface PurchaseOrderItem {
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
  schedule_date?: string
}

export interface PurchaseOrder {
  name: string
  supplier: string
  company: string
  transaction_date: string
  schedule_date?: string
  currency: string
  buying_price_list: string
  set_warehouse?: string
  status?: string
  docstatus?: 0 | 1 | 2
  grand_total?: number
  rounded_total?: number
  per_received?: number
  per_billed?: number
  owner?: string
  creation?: string
  modified?: string
  items: PurchaseOrderItem[]
}

export interface PurchaseOrderFormItem {
  item_code: string
  item_name: string
  description?: string
  qty: number
  uom: string
  stock_uom?: string
  rate?: number
  warehouse?: string
  schedule_date?: string
}

export interface PurchaseOrderFormValues {
  supplier: string
  company: string
  transaction_date: string
  schedule_date?: string
  currency: string
  buying_price_list: string
  set_warehouse?: string
  items: PurchaseOrderFormItem[]
}

export interface PurchaseOrderListResult {
  rows: PurchaseOrder[]
  hasNextPage: boolean
}


export interface Item {
  name: string
  item_code: string
  item_name?: string
  item_group: string
  stock_uom: string
  brand?: string
  description?: string
  image?: string
  disabled?: 0 | 1
  is_stock_item?: 0 | 1
  has_variants?: 0 | 1
  is_sales_item?: 0 | 1
  is_purchase_item?: 0 | 1
  standard_rate?: number
  valuation_rate?: number
  creation?: string
  modified?: string
  owner?: string
}

export interface ItemFormValues {
  item_code: string
  item_name?: string
  item_group: string
  stock_uom: string
  brand?: string
  description?: string
  standard_rate?: number
  valuation_rate?: number
  disabled?: boolean
  is_stock_item?: boolean
  is_sales_item?: boolean
  is_purchase_item?: boolean
}

export interface ItemListResult {
  rows: Item[]
  hasNextPage: boolean
}

export interface ItemPrice {
  name: string
  price_list?: string
  price_list_rate?: number
  currency?: string
  selling?: 0 | 1
  buying?: 0 | 1
}

export interface ItemBin {
  name: string
  warehouse?: string
  actual_qty?: number
  reserved_qty?: number
  projected_qty?: number
}

export interface ItemStockLedgerEntry {
  name: string
  posting_date?: string
  warehouse?: string
  actual_qty?: number
  qty_after_transaction?: number
  voucher_type?: string
  voucher_no?: string
}

export interface ItemRelatedDocuments {
  prices: ItemPrice[]
  bins: ItemBin[]
  stockLedger: ItemStockLedgerEntry[]
}

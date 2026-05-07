export type StockEntryPurpose =
  | 'Material Issue'
  | 'Material Receipt'
  | 'Material Transfer'
  | 'Material Transfer for Manufacture'
  | 'Material Consumption for Manufacture'
  | 'Manufacture'
  | 'Repack'
  | 'Send to Subcontractor'
  | 'Disassemble'
  | 'Receive from Customer'
  | 'Return Raw Material to Customer'
  | 'Subcontracting Delivery'
  | 'Subcontracting Return'

export interface StockEntryItem {
  name?: string
  item_code: string
  item_name?: string
  description?: string
  qty: number
  basic_rate?: number
  basic_amount?: number
  amount?: number
  uom: string
  stock_uom?: string
  conversion_factor?: number
  s_warehouse?: string
  t_warehouse?: string
  batch_no?: string
  serial_no?: string
}

export interface StockEntry {
  name: string
  naming_series?: string
  stock_entry_type: string
  purpose?: StockEntryPurpose
  company: string
  posting_date?: string
  posting_time?: string
  set_posting_time?: 0 | 1
  from_warehouse?: string
  to_warehouse?: string
  remarks?: string
  docstatus?: 0 | 1 | 2
  status?: string
  total_outgoing_value?: number
  total_incoming_value?: number
  total_amount?: number
  add_to_transit?: 0 | 1
  owner?: string
  creation?: string
  modified?: string
  items: StockEntryItem[]
}

export interface StockEntryFormItem {
  item_code: string
  item_name?: string
  description?: string
  qty: number
  basic_rate?: number
  uom: string
  stock_uom?: string
  conversion_factor?: number
  s_warehouse?: string
  t_warehouse?: string
  batch_no?: string
  serial_no?: string
}

export interface StockEntryFormValues {
  naming_series: string
  stock_entry_type: string
  purpose?: StockEntryPurpose
  company: string
  posting_date: string
  posting_time: string
  set_posting_time: boolean
  from_warehouse?: string
  to_warehouse?: string
  remarks?: string
  items: StockEntryFormItem[]
}

export interface StockEntryListResult {
  rows: StockEntry[]
  hasNextPage: boolean
}

export interface StockEntryTypeOption {
  name: string
  purpose: StockEntryPurpose
}

export interface StockEntryCompanyOption {
  name: string
  default_currency?: string
}

export interface StockEntryDefaults {
  namingSeriesOptions: string[]
  companies: StockEntryCompanyOption[]
  stockEntryTypes: StockEntryTypeOption[]
}

export interface StockLedgerMovement {
  name: string
  posting_date?: string
  posting_time?: string
  item_code?: string
  warehouse?: string
  actual_qty?: number
  qty_after_transaction?: number
  stock_value_difference?: number
  valuation_rate?: number
  voucher_type?: string
  voucher_no?: string
  batch_no?: string
}

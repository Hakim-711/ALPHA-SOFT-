export interface DashboardCountMap {
  customers: number | null
  items: number | null
  salesOrders: number | null
  salesInvoices: number | null
}

export interface DashboardCurrencySummary {
  currency: string
  total: number
  count: number
}

export interface DashboardCustomerRow {
  name: string
  customer_name: string
  customer_type?: string
  disabled?: 0 | 1
  modified?: string
}

export interface DashboardPaymentEntryRow {
  name: string
  posting_date?: string
  paid_amount?: number
  received_amount?: number
  party_type?: string
  party?: string
  mode_of_payment?: string
  reference_no?: string
  docstatus?: 0 | 1 | 2
}

export interface DashboardSalesInvoiceRow {
  name: string
  customer?: string
  posting_date?: string
  due_date?: string
  currency?: string
  grand_total?: number
  outstanding_amount?: number
  status?: string
  docstatus?: 0 | 1 | 2
}

export interface DashboardSummary {
  isConnected: boolean
  lastSyncedAt: string | null
  counts: DashboardCountMap
  recentCustomers: DashboardCustomerRow[]
  todaySales: DashboardCurrencySummary[]
  outstandingReceivables: DashboardCurrencySummary[]
  overdueInvoices: DashboardSalesInvoiceRow[]
  recentCollections: DashboardPaymentEntryRow[]
  errors: string[]
}

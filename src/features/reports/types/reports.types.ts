export interface ReportCurrencySummary {
  currency: string
  total: number
  count: number
}

export interface ReportSalesInvoiceRow {
  name: string
  customer?: string
  customer_name?: string
  posting_date?: string
  due_date?: string
  currency?: string
  grand_total?: number
  outstanding_amount?: number
  status?: string
  docstatus?: 0 | 1 | 2
}

export interface ReportPurchaseInvoiceRow {
  name: string
  supplier?: string
  supplier_name?: string
  posting_date?: string
  due_date?: string
  currency?: string
  grand_total?: number
  outstanding_amount?: number
  status?: string
  docstatus?: 0 | 1 | 2
}

export interface ReportPurchaseOrderRow {
  name: string
  supplier?: string
  company?: string
  transaction_date?: string
  schedule_date?: string
  currency?: string
  grand_total?: number
  status?: string
  docstatus?: 0 | 1 | 2
  per_received?: number
  per_billed?: number
}

export interface ReportCollectionRow {
  name: string
  posting_date?: string
  party?: string
  party_name?: string
  received_amount?: number
  paid_amount?: number
  mode_of_payment?: string
  reference_no?: string
}

export interface ReportStockAlertRow {
  name: string
  item_code: string
  warehouse?: string
  actual_qty?: number
  projected_qty?: number
}

export interface ReportCustomerDebtRow {
  customer: string
  customer_name?: string
  currency: string
  outstanding: number
  invoices: number
}

export interface ReportSupplierDebtRow {
  supplier: string
  supplier_name?: string
  currency: string
  outstanding: number
  invoices: number
}

export interface OperationalReports {
  lastSyncedAt: string
  todaySales: ReportCurrencySummary[]
  monthSales: ReportCurrencySummary[]
  todayPurchases: ReportCurrencySummary[]
  monthPurchases: ReportCurrencySummary[]
  outstandingByCurrency: ReportCurrencySummary[]
  supplierOutstandingByCurrency: ReportCurrencySummary[]
  topDebtors: ReportCustomerDebtRow[]
  topSupplierPayables: ReportSupplierDebtRow[]
  overdueInvoices: ReportSalesInvoiceRow[]
  overduePurchaseInvoices: ReportPurchaseInvoiceRow[]
  openPurchaseOrders: ReportPurchaseOrderRow[]
  recentCollections: ReportCollectionRow[]
  lowStock: ReportStockAlertRow[]
  errors: string[]
}

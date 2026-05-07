import { http } from '@/core/api/http'
import type { FrappeListResponse } from '@/core/api/types'
import { getStorePreferences } from '@/core/config/store-preferences'
import type {
  OperationalReports,
  ReportCollectionRow,
  ReportCurrencySummary,
  ReportCustomerDebtRow,
  ReportPurchaseInvoiceRow,
  ReportPurchaseOrderRow,
  ReportSalesInvoiceRow,
  ReportStockAlertRow,
  ReportSupplierDebtRow,
} from '../types/reports.types'

function dateInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function todayValue() {
  return dateInputValue()
}

function monthStartValue() {
  const now = new Date()
  return dateInputValue(new Date(now.getFullYear(), now.getMonth(), 1))
}

async function safeValue<T>(loader: () => Promise<T>, fallback: T, errorMessage: string) {
  try {
    return {
      value: await loader(),
      error: null as string | null,
    }
  } catch {
    return {
      value: fallback,
      error: errorMessage,
    }
  }
}

function aggregateByCurrency<T extends { currency?: string }>(
  rows: T[],
  selector: (row: T) => number | undefined,
): ReportCurrencySummary[] {
  const buckets = new Map<string, ReportCurrencySummary>()

  for (const row of rows) {
    const amount = Number(selector(row) ?? 0)

    if (amount <= 0) {
      continue
    }

    const currency = row.currency || 'غير محدد'
    const current = buckets.get(currency)

    if (current) {
      current.total += amount
      current.count += 1
    } else {
      buckets.set(currency, { currency, total: amount, count: 1 })
    }
  }

  return [...buckets.values()].sort((first, second) => second.total - first.total)
}

function aggregateCustomerDebts(rows: ReportSalesInvoiceRow[]): ReportCustomerDebtRow[] {
  const buckets = new Map<string, ReportCustomerDebtRow>()

  for (const row of rows) {
    const outstanding = Number(row.outstanding_amount ?? 0)

    if (outstanding <= 0) {
      continue
    }

    const customer = row.customer || row.customer_name || 'عميل غير محدد'
    const currency = row.currency || 'غير محدد'
    const key = `${customer}__${currency}`
    const current = buckets.get(key)

    if (current) {
      current.outstanding += outstanding
      current.invoices += 1
    } else {
      buckets.set(key, {
        customer,
        customer_name: row.customer_name,
        currency,
        outstanding,
        invoices: 1,
      })
    }
  }

  return [...buckets.values()].sort((first, second) => second.outstanding - first.outstanding).slice(0, 10)
}

function aggregateSupplierDebts(rows: ReportPurchaseInvoiceRow[]): ReportSupplierDebtRow[] {
  const buckets = new Map<string, ReportSupplierDebtRow>()

  for (const row of rows) {
    const outstanding = Number(row.outstanding_amount ?? 0)

    if (outstanding <= 0) {
      continue
    }

    const supplier = row.supplier || row.supplier_name || 'مورد غير محدد'
    const currency = row.currency || 'غير محدد'
    const key = `${supplier}__${currency}`
    const current = buckets.get(key)

    if (current) {
      current.outstanding += outstanding
      current.invoices += 1
    } else {
      buckets.set(key, {
        supplier,
        supplier_name: row.supplier_name,
        currency,
        outstanding,
        invoices: 1,
      })
    }
  }

  return [...buckets.values()].sort((first, second) => second.outstanding - first.outstanding).slice(0, 10)
}

async function listSubmittedInvoices() {
  const response = await http.get<FrappeListResponse<ReportSalesInvoiceRow>>('/resource/Sales Invoice', {
    params: {
      fields: JSON.stringify([
        'name',
        'customer',
        'customer_name',
        'posting_date',
        'due_date',
        'currency',
        'grand_total',
        'outstanding_amount',
        'status',
        'docstatus',
      ]),
      filters: JSON.stringify([['Sales Invoice', 'docstatus', '=', 1]]),
      limit_page_length: 500,
      order_by: 'posting_date desc',
    },
  })

  return response.data.data
}

async function listSubmittedPurchaseInvoices() {
  const response = await http.get<FrappeListResponse<ReportPurchaseInvoiceRow>>('/resource/Purchase Invoice', {
    params: {
      fields: JSON.stringify([
        'name',
        'supplier',
        'supplier_name',
        'posting_date',
        'due_date',
        'currency',
        'grand_total',
        'outstanding_amount',
        'status',
        'docstatus',
      ]),
      filters: JSON.stringify([['Purchase Invoice', 'docstatus', '=', 1]]),
      limit_page_length: 500,
      order_by: 'posting_date desc',
    },
  })

  return response.data.data
}

async function listOpenPurchaseOrders() {
  const response = await http.get<FrappeListResponse<ReportPurchaseOrderRow>>('/resource/Purchase Order', {
    params: {
      fields: JSON.stringify([
        'name',
        'supplier',
        'company',
        'transaction_date',
        'schedule_date',
        'currency',
        'grand_total',
        'status',
        'docstatus',
        'per_received',
        'per_billed',
      ]),
      filters: JSON.stringify([['Purchase Order', 'docstatus', '=', 1]]),
      limit_page_length: 100,
      order_by: 'transaction_date desc',
    },
  })

  return response.data.data
    .filter((order) => !['Completed', 'Closed', 'Cancelled'].includes(order.status ?? ''))
    .filter((order) => Number(order.per_received ?? 0) < 100 || Number(order.per_billed ?? 0) < 100)
    .slice(0, 12)
}

async function listRecentCollections() {
  const response = await http.get<FrappeListResponse<ReportCollectionRow>>('/resource/Payment Entry', {
    params: {
      fields: JSON.stringify([
        'name',
        'posting_date',
        'party',
        'party_name',
        'received_amount',
        'paid_amount',
        'mode_of_payment',
        'reference_no',
      ]),
      filters: JSON.stringify([
        ['Payment Entry', 'docstatus', '=', 1],
        ['Payment Entry', 'payment_type', '=', 'Receive'],
        ['Payment Entry', 'party_type', '=', 'Customer'],
      ]),
      limit_page_length: 10,
      order_by: 'posting_date desc',
    },
  })

  return response.data.data
}

async function listLowStock(threshold: number) {
  const response = await http.get<FrappeListResponse<ReportStockAlertRow>>('/resource/Bin', {
    params: {
      fields: JSON.stringify(['name', 'item_code', 'warehouse', 'actual_qty', 'projected_qty']),
      filters: JSON.stringify([['Bin', 'actual_qty', '<=', threshold]]),
      limit_page_length: 20,
      order_by: 'actual_qty asc',
    },
  })

  return response.data.data
}

export async function getOperationalReports(): Promise<OperationalReports> {
  const today = todayValue()
  const monthStart = monthStartValue()
  const preferences = getStorePreferences()
  const [invoices, purchaseInvoices, openPurchaseOrders, collections, lowStock] = await Promise.all([
    safeValue(listSubmittedInvoices, [], 'تعذر تحميل فواتير البيع.'),
    safeValue(listSubmittedPurchaseInvoices, [], 'تعذر تحميل فواتير الشراء.'),
    safeValue(listOpenPurchaseOrders, [], 'تعذر تحميل أوامر الشراء المفتوحة.'),
    safeValue(listRecentCollections, [], 'تعذر تحميل التحصيلات.'),
    safeValue(() => listLowStock(preferences.lowStockAlertQty), [], 'تعذر تحميل تنبيهات المخزون.'),
  ])

  const invoiceRows = invoices.value
  const purchaseInvoiceRows = purchaseInvoices.value
  const monthInvoices = invoiceRows.filter((row) => String(row.posting_date ?? '') >= monthStart)
  const todayInvoices = invoiceRows.filter((row) => row.posting_date === today)
  const monthPurchaseInvoices = purchaseInvoiceRows.filter((row) => String(row.posting_date ?? '') >= monthStart)
  const todayPurchaseInvoices = purchaseInvoiceRows.filter((row) => row.posting_date === today)
  const overdueInvoices = invoiceRows
    .filter((row) => Boolean(row.due_date) && String(row.due_date) < today && Number(row.outstanding_amount ?? 0) > 0)
    .sort((first, second) => String(first.due_date).localeCompare(String(second.due_date)))
    .slice(0, 10)
  const overduePurchaseInvoices = purchaseInvoiceRows
    .filter((row) => Boolean(row.due_date) && String(row.due_date) < today && Number(row.outstanding_amount ?? 0) > 0)
    .sort((first, second) => String(first.due_date).localeCompare(String(second.due_date)))
    .slice(0, 10)

  return {
    lastSyncedAt: new Date().toISOString(),
    todaySales: aggregateByCurrency(todayInvoices, (row) => row.grand_total),
    monthSales: aggregateByCurrency(monthInvoices, (row) => row.grand_total),
    todayPurchases: aggregateByCurrency(todayPurchaseInvoices, (row) => row.grand_total),
    monthPurchases: aggregateByCurrency(monthPurchaseInvoices, (row) => row.grand_total),
    outstandingByCurrency: aggregateByCurrency(invoiceRows, (row) => row.outstanding_amount),
    supplierOutstandingByCurrency: aggregateByCurrency(purchaseInvoiceRows, (row) => row.outstanding_amount),
    topDebtors: aggregateCustomerDebts(invoiceRows),
    topSupplierPayables: aggregateSupplierDebts(purchaseInvoiceRows),
    overdueInvoices,
    overduePurchaseInvoices,
    openPurchaseOrders: openPurchaseOrders.value,
    recentCollections: collections.value,
    lowStock: lowStock.value,
    errors: [invoices.error, purchaseInvoices.error, openPurchaseOrders.error, collections.error, lowStock.error].filter(
      (error): error is string => Boolean(error),
    ),
  }
}

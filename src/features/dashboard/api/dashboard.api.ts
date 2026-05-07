import { http } from '@/core/api/http'
import type { FrappeListResponse } from '@/core/api/types'
import { formatDateInputValue } from '@/shared/utils/date'
import type {
  DashboardCurrencySummary,
  DashboardCustomerRow,
  DashboardPaymentEntryRow,
  DashboardSalesInvoiceRow,
  DashboardSummary,
} from '../types/dashboard.types'

interface FrappeMethodResponse<T> {
  message: T
}

function todayValue() {
  return formatDateInputValue()
}

async function getDoctypeCount(doctype: string) {
  const response = await http.get<FrappeMethodResponse<number>>('/method/frappe.client.get_count', {
    params: {
      doctype,
    },
  })

  return response.data.message
}

async function listRecent<T>(doctype: string, fields: string[]) {
  const response = await http.get<FrappeListResponse<T>>(`/resource/${encodeURIComponent(doctype)}`, {
    params: {
      fields: JSON.stringify(fields),
      limit_page_length: 5,
      order_by: 'modified desc',
    },
  })

  return response.data.data
}

async function listSubmittedSalesInvoices() {
  const response = await http.get<FrappeListResponse<DashboardSalesInvoiceRow>>('/resource/Sales Invoice', {
    params: {
      fields: JSON.stringify([
        'name',
        'customer',
        'posting_date',
        'due_date',
        'currency',
        'grand_total',
        'outstanding_amount',
        'status',
        'docstatus',
      ]),
      filters: JSON.stringify([['Sales Invoice', 'docstatus', '=', 1]]),
      limit_page_length: 200,
      order_by: 'modified desc',
    },
  })

  return response.data.data
}

async function listRecentCollections() {
  const response = await http.get<FrappeListResponse<DashboardPaymentEntryRow>>('/resource/Payment Entry', {
    params: {
      fields: JSON.stringify([
        'name',
        'posting_date',
        'paid_amount',
        'received_amount',
        'party_type',
        'party',
        'mode_of_payment',
        'reference_no',
        'docstatus',
      ]),
      filters: JSON.stringify([
        ['Payment Entry', 'docstatus', '=', 1],
        ['Payment Entry', 'party_type', '=', 'Customer'],
      ]),
      limit_page_length: 8,
      order_by: 'modified desc',
    },
  })

  return response.data.data
}

function aggregateByCurrency(
  rows: DashboardSalesInvoiceRow[],
  amountSelector: (row: DashboardSalesInvoiceRow) => number | undefined,
): DashboardCurrencySummary[] {
  const buckets = new Map<string, DashboardCurrencySummary>()

  for (const row of rows) {
    const currency = row.currency || 'غير محدد'
    const amount = amountSelector(row) ?? 0
    const bucket = buckets.get(currency)

    if (bucket) {
      bucket.total += amount
      bucket.count += 1
      continue
    }

    buckets.set(currency, {
      currency,
      total: amount,
      count: 1,
    })
  }

  return [...buckets.values()].sort((first, second) => second.total - first.total)
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

function filterTodayInvoices(rows: DashboardSalesInvoiceRow[]) {
  const today = todayValue()
  return rows.filter((row) => row.posting_date === today)
}

function filterOutstandingInvoices(rows: DashboardSalesInvoiceRow[]) {
  return rows.filter((row) => (row.outstanding_amount ?? 0) > 0)
}

function filterOverdueInvoices(rows: DashboardSalesInvoiceRow[]) {
  const today = todayValue()
  return rows
    .filter((row) => Boolean(row.due_date) && (row.outstanding_amount ?? 0) > 0 && String(row.due_date) < today)
    .sort((first, second) => String(first.due_date).localeCompare(String(second.due_date)))
    .slice(0, 6)
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [customersCount, itemsCount, salesOrdersCount, salesInvoicesCount, recentCustomers, salesInvoices, recentCollections] =
    await Promise.all([
      safeValue(() => getDoctypeCount('Customer'), null, 'تعذر تحميل عدد العملاء.'),
      safeValue(() => getDoctypeCount('Item'), null, 'تعذر تحميل عدد الأصناف.'),
      safeValue(() => getDoctypeCount('Sales Order'), null, 'تعذر تحميل عدد أوامر البيع.'),
      safeValue(() => getDoctypeCount('Sales Invoice'), null, 'تعذر تحميل عدد فواتير البيع.'),
      safeValue<DashboardCustomerRow[]>(
        () => listRecent<DashboardCustomerRow>('Customer', ['name', 'customer_name', 'customer_type', 'disabled', 'modified']),
        [],
        'تعذر تحميل أحدث العملاء.',
      ),
      safeValue<DashboardSalesInvoiceRow[]>(() => listSubmittedSalesInvoices(), [], 'تعذر تحميل بيانات الفواتير المحاسبية.'),
      safeValue<DashboardPaymentEntryRow[]>(() => listRecentCollections(), [], 'تعذر تحميل آخر التحصيلات.'),
    ])

  const allErrors = [
    customersCount.error,
    itemsCount.error,
    salesOrdersCount.error,
    salesInvoicesCount.error,
    recentCustomers.error,
    salesInvoices.error,
    recentCollections.error,
  ].filter((message): message is string => Boolean(message))

  const submittedInvoices = salesInvoices.value
  const todaySales = aggregateByCurrency(filterTodayInvoices(submittedInvoices), (row) => row.grand_total)
  const outstandingReceivables = aggregateByCurrency(filterOutstandingInvoices(submittedInvoices), (row) => row.outstanding_amount)

  return {
    isConnected: allErrors.length < 7,
    lastSyncedAt: allErrors.length < 7 ? new Date().toISOString() : null,
    counts: {
      customers: customersCount.value,
      items: itemsCount.value,
      salesOrders: salesOrdersCount.value,
      salesInvoices: salesInvoicesCount.value,
    },
    recentCustomers: recentCustomers.value,
    todaySales,
    outstandingReceivables,
    overdueInvoices: filterOverdueInvoices(submittedInvoices),
    recentCollections: recentCollections.value,
    errors: allErrors,
  }
}

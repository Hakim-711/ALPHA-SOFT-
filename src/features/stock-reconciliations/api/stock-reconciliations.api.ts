import { http } from '@/core/api/http'
import { getResourceCount } from '@/core/api/resource'
import type { FrappeDocResponse, FrappeListResponse } from '@/core/api/types'
import { getItem } from '@/features/items/api/items.api'
import { formatDateInputValue } from '@/shared/utils/date'
import type {
  StockBinSnapshot,
  StockReconciliation,
  StockReconciliationDefaults,
  StockReconciliationFormItem,
  StockReconciliationFormValues,
  StockReconciliationListResult,
  StockReconciliationPurpose,
} from '../types/stock-reconciliation.types'

interface FrappeMethodResponse<T> {
  message: T
}

type ListStockReconciliationsParams = {
  limit?: number
  offset?: number
  search?: string
  lifecycle?: 'draft' | 'submitted' | 'cancelled' | 'all'
  company?: string
  purpose?: StockReconciliationPurpose | 'all'
}

const STOCK_RECONCILIATION_FIELDS = [
  'name',
  'naming_series',
  'company',
  'posting_date',
  'posting_time',
  'purpose',
  'set_posting_time',
  'expense_account',
  'cost_center',
  'docstatus',
  'owner',
  'creation',
  'modified',
]

const PURPOSE_OPTIONS: StockReconciliationPurpose[] = ['Opening Stock', 'Stock Reconciliation']

function cleanString(value?: string) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : undefined
}

function cleanNumber(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function buildFilters(params: ListStockReconciliationsParams) {
  const filters: unknown[] = []

  if (params.lifecycle === 'draft') {
    filters.push(['Stock Reconciliation', 'docstatus', '=', 0])
  }

  if (params.lifecycle === 'submitted') {
    filters.push(['Stock Reconciliation', 'docstatus', '=', 1])
  }

  if (params.lifecycle === 'cancelled') {
    filters.push(['Stock Reconciliation', 'docstatus', '=', 2])
  }

  if (params.company && params.company !== 'all') {
    filters.push(['Stock Reconciliation', 'company', '=', params.company])
  }

  if (params.purpose && params.purpose !== 'all') {
    filters.push(['Stock Reconciliation', 'purpose', '=', params.purpose])
  }

  return filters
}

function buildOrFilters(search?: string) {
  const trimmed = search?.trim()

  if (!trimmed) {
    return []
  }

  return [
    ['Stock Reconciliation', 'name', 'like', `%${trimmed}%`],
    ['Stock Reconciliation', 'company', 'like', `%${trimmed}%`],
    ['Stock Reconciliation', 'purpose', 'like', `%${trimmed}%`],
    ['Stock Reconciliation', 'expense_account', 'like', `%${trimmed}%`],
  ]
}

function normalizeTimeValue(value?: string) {
  if (!value) {
    return new Date().toTimeString().slice(0, 5)
  }

  const [hours = '00', minutes = '00'] = value.split(':')
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

function normalizeItems(items: StockReconciliationFormItem[]) {
  return items.map((item) => ({
    doctype: 'Stock Reconciliation Item',
    item_code: item.item_code.trim(),
    warehouse: item.warehouse.trim(),
    qty: item.qty,
    valuation_rate: cleanNumber(item.valuation_rate),
    batch_no: cleanString(item.batch_no),
    serial_and_batch_bundle: cleanString(item.serial_and_batch_bundle),
  }))
}

function toStockReconciliationPayload(values: StockReconciliationFormValues) {
  return {
    naming_series: values.naming_series.trim(),
    company: values.company.trim(),
    posting_date: values.posting_date,
    posting_time: values.posting_time,
    purpose: values.purpose,
    set_posting_time: values.set_posting_time ? 1 : 0,
    expense_account: cleanString(values.expense_account),
    cost_center: cleanString(values.cost_center),
    remarks: cleanString(values.remarks),
    items: normalizeItems(values.items),
  }
}

function currentDateValue() {
  return formatDateInputValue()
}

export function createEmptyStockReconciliationItem(): StockReconciliationFormItem {
  return {
    item_code: '',
    item_name: '',
    warehouse: '',
    qty: 0,
    valuation_rate: undefined,
    current_qty: 0,
    current_valuation_rate: undefined,
    current_amount: 0,
    batch_no: '',
    serial_and_batch_bundle: '',
  }
}

export function stockReconciliationToFormValues(document?: StockReconciliation): StockReconciliationFormValues {
  return {
    naming_series: document?.naming_series ?? 'MAT-RECO-.YYYY.-',
    company: document?.company ?? '',
    posting_date: document?.posting_date ?? currentDateValue(),
    posting_time: normalizeTimeValue(document?.posting_time),
    purpose: document?.purpose ?? 'Stock Reconciliation',
    set_posting_time: document?.set_posting_time !== 0,
    expense_account: document?.expense_account ?? '',
    cost_center: document?.cost_center ?? '',
    remarks: document?.remarks ?? '',
    items:
      document?.items?.map((item) => ({
        item_code: item.item_code ?? '',
        item_name: item.item_name ?? '',
        warehouse: item.warehouse ?? '',
        qty: item.qty ?? 0,
        valuation_rate: item.valuation_rate,
        current_qty: item.current_qty ?? 0,
        current_valuation_rate: item.current_valuation_rate,
        current_amount: item.current_amount ?? 0,
        batch_no: item.batch_no ?? '',
        serial_and_batch_bundle: item.serial_and_batch_bundle ?? '',
      })) ?? [createEmptyStockReconciliationItem()],
  }
}

export async function listStockReconciliations(params: ListStockReconciliationsParams = {}): Promise<StockReconciliationListResult> {
  const { limit = 20, offset = 0 } = params
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)
  const response = await http.get<FrappeListResponse<StockReconciliation>>('/resource/Stock Reconciliation', {
    params: {
      fields: JSON.stringify(STOCK_RECONCILIATION_FIELDS),
      limit_start: offset,
      limit_page_length: limit + 1,
      order_by: 'modified desc',
      ...(filters.length > 0 ? { filters: JSON.stringify(filters) } : {}),
      ...(orFilters.length > 0 ? { or_filters: JSON.stringify(orFilters) } : {}),
    },
  })

  return {
    rows: response.data.data.slice(0, limit),
    hasNextPage: response.data.data.length > limit,
  }
}

export async function getStockReconciliationSummary(params: ListStockReconciliationsParams = {}) {
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const [totalCount, draftCount, submittedCount, cancelledCount, openingCount] = await Promise.all([
    getResourceCount('Stock Reconciliation', { filters, orFilters }),
    getResourceCount('Stock Reconciliation', {
      filters: [...filters, ['Stock Reconciliation', 'docstatus', '=', 0]],
      orFilters,
    }),
    getResourceCount('Stock Reconciliation', {
      filters: [...filters, ['Stock Reconciliation', 'docstatus', '=', 1]],
      orFilters,
    }),
    getResourceCount('Stock Reconciliation', {
      filters: [...filters, ['Stock Reconciliation', 'docstatus', '=', 2]],
      orFilters,
    }),
    getResourceCount('Stock Reconciliation', {
      filters: [...filters, ['Stock Reconciliation', 'purpose', '=', 'Opening Stock']],
      orFilters,
    }),
  ])

  return {
    totalCount,
    draftCount,
    submittedCount,
    cancelledCount,
    openingCount,
  }
}

export async function getStockReconciliation(name: string) {
  const response = await http.get<FrappeDocResponse<StockReconciliation>>(`/resource/Stock Reconciliation/${encodeURIComponent(name)}`)
  return response.data.data
}

export async function createStockReconciliation(values: StockReconciliationFormValues) {
  const response = await http.post<FrappeDocResponse<StockReconciliation>>(
    '/resource/Stock Reconciliation',
    toStockReconciliationPayload(values),
  )

  return response.data.data
}

export async function updateStockReconciliation(name: string, values: StockReconciliationFormValues) {
  const response = await http.put<FrappeDocResponse<StockReconciliation>>(
    `/resource/Stock Reconciliation/${encodeURIComponent(name)}`,
    toStockReconciliationPayload(values),
  )

  return response.data.data
}

export async function submitStockReconciliation(document: StockReconciliation) {
  const response = await http.post<FrappeMethodResponse<StockReconciliation>>('/method/frappe.client.submit', {
    doc: JSON.stringify(document),
  })

  return response.data.message
}

export async function cancelStockReconciliation(document: StockReconciliation) {
  const response = await http.post<FrappeMethodResponse<StockReconciliation>>('/method/frappe.client.cancel', {
    doc: JSON.stringify(document),
  })

  return response.data.message
}

export async function getStockBinSnapshot(itemCode: string, warehouse: string): Promise<StockBinSnapshot | null> {
  const response = await http.get<FrappeListResponse<StockBinSnapshot>>('/resource/Bin', {
    params: {
      fields: JSON.stringify(['item_code', 'warehouse', 'actual_qty', 'valuation_rate', 'stock_value']),
      filters: JSON.stringify([
        ['Bin', 'item_code', '=', itemCode],
        ['Bin', 'warehouse', '=', warehouse],
      ]),
      limit_page_length: 1,
    },
  })

  return response.data.data[0] ?? null
}

export async function getStockReconciliationItemPrefill(itemCode: string, warehouse?: string) {
  const item = await getItem(itemCode)
  const snapshot = warehouse?.trim() ? await getStockBinSnapshot(itemCode, warehouse.trim()).catch(() => null) : null

  return {
    item_code: item.item_code || item.name,
    item_name: item.item_name || item.item_code || item.name,
    warehouse: warehouse?.trim() ?? '',
    qty: snapshot?.actual_qty ?? 0,
    valuation_rate: snapshot?.valuation_rate ?? item.valuation_rate ?? item.standard_rate,
    current_qty: snapshot?.actual_qty ?? 0,
    current_valuation_rate: snapshot?.valuation_rate ?? item.valuation_rate ?? item.standard_rate,
    current_amount: snapshot?.stock_value ?? 0,
  }
}

export async function getDefaultStockReconciliationContext(): Promise<StockReconciliationDefaults> {
  const companiesResponse = await http
    .get<FrappeListResponse<{ name: string; default_currency?: string; stock_adjustment_account?: string; cost_center?: string }>>(
      '/resource/Company',
      {
        params: {
          fields: JSON.stringify(['name', 'default_currency', 'stock_adjustment_account', 'cost_center']),
          limit_page_length: 20,
          order_by: 'modified desc',
        },
      },
    )
    .catch(() => ({
      data: {
        data: [],
      },
    }))

  return {
    namingSeriesOptions: ['MAT-RECO-.YYYY.-'],
    companies: companiesResponse.data.data,
    purposeOptions: PURPOSE_OPTIONS,
  }
}

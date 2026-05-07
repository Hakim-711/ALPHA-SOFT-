import { http } from '@/core/api/http'
import { getResourceCount } from '@/core/api/resource'
import type { FrappeDocResponse, FrappeListResponse } from '@/core/api/types'
import { getItem } from '@/features/items/api/items.api'
import { formatDateInputValue } from '@/shared/utils/date'
import type {
  StockEntry,
  StockEntryDefaults,
  StockEntryFormItem,
  StockEntryFormValues,
  StockEntryListResult,
  StockLedgerMovement,
  StockEntryPurpose,
} from '../types/stock.types'

interface FrappeMethodResponse<T> {
  message: T
}

type ListStockEntriesParams = {
  limit?: number
  offset?: number
  search?: string
  lifecycle?: 'draft' | 'submitted' | 'cancelled' | 'all'
  company?: string
  purpose?: StockEntryPurpose | 'all'
}

const STOCK_ENTRY_FIELDS = [
  'name',
  'naming_series',
  'stock_entry_type',
  'purpose',
  'company',
  'posting_date',
  'posting_time',
  'set_posting_time',
  'from_warehouse',
  'to_warehouse',
  'remarks',
  'docstatus',
  'status',
  'total_outgoing_value',
  'total_incoming_value',
  'total_amount',
  'creation',
  'modified',
  'owner',
]

const SUPPORTED_PURPOSES: StockEntryPurpose[] = ['Material Receipt', 'Material Issue', 'Material Transfer', 'Repack']

function cleanString(value?: string) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : undefined
}

function cleanNumber(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function buildFilters(params: ListStockEntriesParams) {
  const filters: unknown[] = []

  if (params.lifecycle === 'draft') {
    filters.push(['Stock Entry', 'docstatus', '=', 0])
  }

  if (params.lifecycle === 'submitted') {
    filters.push(['Stock Entry', 'docstatus', '=', 1])
  }

  if (params.lifecycle === 'cancelled') {
    filters.push(['Stock Entry', 'docstatus', '=', 2])
  }

  if (params.company && params.company !== 'all') {
    filters.push(['Stock Entry', 'company', '=', params.company])
  }

  if (params.purpose && params.purpose !== 'all') {
    filters.push(['Stock Entry', 'purpose', '=', params.purpose])
  }

  return filters
}

function buildOrFilters(search?: string) {
  const trimmed = search?.trim()

  if (!trimmed) {
    return []
  }

  return [
    ['Stock Entry', 'name', 'like', `%${trimmed}%`],
    ['Stock Entry', 'stock_entry_type', 'like', `%${trimmed}%`],
    ['Stock Entry', 'purpose', 'like', `%${trimmed}%`],
    ['Stock Entry', 'from_warehouse', 'like', `%${trimmed}%`],
    ['Stock Entry', 'to_warehouse', 'like', `%${trimmed}%`],
  ]
}

function normalizeItems(items: StockEntryFormItem[], values: StockEntryFormValues) {
  return items.map((item) => ({
    doctype: 'Stock Entry Detail',
    item_code: item.item_code.trim(),
    item_name: cleanString(item.item_name),
    description: cleanString(item.description),
    qty: item.qty,
    basic_rate: cleanNumber(item.basic_rate),
    uom: item.uom.trim(),
    stock_uom: cleanString(item.stock_uom) ?? item.uom.trim(),
    conversion_factor: cleanNumber(item.conversion_factor) ?? 1,
    s_warehouse: cleanString(item.s_warehouse) ?? cleanString(values.from_warehouse),
    t_warehouse: cleanString(item.t_warehouse) ?? cleanString(values.to_warehouse),
    batch_no: cleanString(item.batch_no),
    serial_no: cleanString(item.serial_no),
  }))
}

function toStockEntryPayload(values: StockEntryFormValues) {
  return {
    naming_series: values.naming_series.trim(),
    stock_entry_type: values.stock_entry_type.trim(),
    purpose: cleanString(values.purpose),
    company: values.company.trim(),
    posting_date: values.posting_date,
    posting_time: values.posting_time,
    set_posting_time: values.set_posting_time ? 1 : 0,
    from_warehouse: cleanString(values.from_warehouse),
    to_warehouse: cleanString(values.to_warehouse),
    remarks: cleanString(values.remarks),
    items: normalizeItems(values.items, values),
  }
}

function currentDateValue() {
  return formatDateInputValue()
}

function currentTimeValue() {
  return new Date().toTimeString().slice(0, 5)
}

function normalizeTimeValue(value?: string) {
  if (!value) {
    return currentTimeValue()
  }

  const [hours = '00', minutes = '00'] = value.split(':')
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

export function createEmptyStockEntryItem(): StockEntryFormItem {
  return {
    item_code: '',
    item_name: '',
    description: '',
    qty: 1,
    basic_rate: undefined,
    uom: '',
    stock_uom: '',
    conversion_factor: 1,
    s_warehouse: '',
    t_warehouse: '',
    batch_no: '',
    serial_no: '',
  }
}

export function stockEntryToFormValues(entry?: StockEntry): StockEntryFormValues {
  return {
    naming_series: entry?.naming_series ?? 'MAT-STE-.YYYY.-',
    stock_entry_type: entry?.stock_entry_type ?? '',
    purpose: entry?.purpose,
    company: entry?.company ?? '',
    posting_date: entry?.posting_date ?? currentDateValue(),
    posting_time: normalizeTimeValue(entry?.posting_time),
    set_posting_time: entry?.set_posting_time !== 0,
    from_warehouse: entry?.from_warehouse ?? '',
    to_warehouse: entry?.to_warehouse ?? '',
    remarks: entry?.remarks ?? '',
    items:
      entry?.items?.map((item) => ({
        item_code: item.item_code ?? '',
        item_name: item.item_name ?? '',
        description: item.description ?? '',
        qty: item.qty ?? 1,
        basic_rate: item.basic_rate,
        uom: item.uom ?? item.stock_uom ?? '',
        stock_uom: item.stock_uom ?? '',
        conversion_factor: item.conversion_factor ?? 1,
        s_warehouse: item.s_warehouse ?? '',
        t_warehouse: item.t_warehouse ?? '',
        batch_no: item.batch_no ?? '',
        serial_no: item.serial_no ?? '',
      })) ?? [createEmptyStockEntryItem()],
  }
}

export async function listStockEntries(params: ListStockEntriesParams = {}): Promise<StockEntryListResult> {
  const { limit = 20, offset = 0 } = params
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)
  const response = await http.get<FrappeListResponse<StockEntry>>('/resource/Stock Entry', {
    params: {
      fields: JSON.stringify(STOCK_ENTRY_FIELDS),
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

export async function getStockEntrySummary(params: ListStockEntriesParams = {}) {
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const [totalCount, draftCount, submittedCount, cancelledCount] = await Promise.all([
    getResourceCount('Stock Entry', { filters, orFilters }),
    getResourceCount('Stock Entry', {
      filters: [...filters, ['Stock Entry', 'docstatus', '=', 0]],
      orFilters,
    }),
    getResourceCount('Stock Entry', {
      filters: [...filters, ['Stock Entry', 'docstatus', '=', 1]],
      orFilters,
    }),
    getResourceCount('Stock Entry', {
      filters: [...filters, ['Stock Entry', 'docstatus', '=', 2]],
      orFilters,
    }),
  ])

  return {
    totalCount,
    draftCount,
    submittedCount,
    cancelledCount,
  }
}

export async function getStockEntry(name: string) {
  const response = await http.get<FrappeDocResponse<StockEntry>>(`/resource/Stock Entry/${encodeURIComponent(name)}`)
  return response.data.data
}

export async function createStockEntry(values: StockEntryFormValues) {
  const response = await http.post<FrappeDocResponse<StockEntry>>('/resource/Stock Entry', toStockEntryPayload(values))
  return response.data.data
}

export async function updateStockEntry(name: string, values: StockEntryFormValues) {
  const response = await http.put<FrappeDocResponse<StockEntry>>(
    `/resource/Stock Entry/${encodeURIComponent(name)}`,
    toStockEntryPayload(values),
  )

  return response.data.data
}

export async function submitStockEntry(entry: StockEntry) {
  const response = await http.post<FrappeMethodResponse<StockEntry>>('/method/frappe.client.submit', {
    doc: JSON.stringify(entry),
  })

  return response.data.message
}

export async function cancelStockEntry(entry: StockEntry) {
  const response = await http.post<FrappeMethodResponse<StockEntry>>('/method/frappe.client.cancel', {
    doc: JSON.stringify(entry),
  })

  return response.data.message
}

export async function getStockEntryItemPrefill(itemCode: string) {
  const item = await getItem(itemCode)

  return {
    item_code: item.item_code || item.name,
    item_name: item.item_name || item.item_code || item.name,
    description: item.description || '',
    uom: item.stock_uom || '',
    stock_uom: item.stock_uom || '',
    basic_rate: item.valuation_rate ?? item.standard_rate,
    conversion_factor: 1,
  }
}

export async function getDefaultStockEntryContext(): Promise<StockEntryDefaults> {
  const [companiesResponse, stockEntryTypesResponse] = await Promise.all([
    http.get<FrappeListResponse<{ name: string; default_currency?: string }>>('/resource/Company', {
      params: {
        fields: JSON.stringify(['name', 'default_currency']),
        limit_page_length: 20,
        order_by: 'modified desc',
      },
    }).catch(() => ({
      data: {
        data: [],
      },
    })),
    http.get<FrappeListResponse<{ name: string; purpose: StockEntryPurpose }>>('/resource/Stock Entry Type', {
      params: {
        fields: JSON.stringify(['name', 'purpose']),
        filters: JSON.stringify([['Stock Entry Type', 'purpose', 'in', SUPPORTED_PURPOSES]]),
        limit_page_length: 50,
        order_by: 'name asc',
      },
    }).catch(() => ({
      data: {
        data: SUPPORTED_PURPOSES.map((purpose) => ({
          name: purpose,
          purpose,
        })),
      },
    })),
  ])

  return {
    namingSeriesOptions: ['MAT-STE-.YYYY.-'],
    companies: companiesResponse.data.data,
    stockEntryTypes: stockEntryTypesResponse.data.data,
  }
}

export async function listStockEntryLedger(voucherNo?: string) {
  const filters = voucherNo
    ? [
        ['Stock Ledger Entry', 'voucher_type', '=', 'Stock Entry'],
        ['Stock Ledger Entry', 'voucher_no', '=', voucherNo],
      ]
    : []

  const response = await http.get<FrappeListResponse<StockLedgerMovement>>('/resource/Stock Ledger Entry', {
    params: {
      fields: JSON.stringify([
        'name',
        'posting_date',
        'posting_time',
        'item_code',
        'warehouse',
        'actual_qty',
        'qty_after_transaction',
        'stock_value_difference',
        'valuation_rate',
        'voucher_type',
        'voucher_no',
        'batch_no',
      ]),
      limit_page_length: voucherNo ? 20 : 8,
      order_by: 'creation desc',
      ...(filters.length > 0 ? { filters: JSON.stringify(filters) } : {}),
    },
  })

  return response.data.data
}

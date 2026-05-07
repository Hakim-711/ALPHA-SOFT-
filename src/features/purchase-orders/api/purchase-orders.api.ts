import { http } from '@/core/api/http'
import { getResourceCount } from '@/core/api/resource'
import type { FrappeDocResponse, FrappeListResponse } from '@/core/api/types'
import { getItem } from '@/features/items/api/items.api'
import { formatDateInputValue } from '@/shared/utils/date'
import type { PurchaseOrder, PurchaseOrderFormItem, PurchaseOrderFormValues, PurchaseOrderListResult } from '../types/purchase-order.types'

interface FrappeMethodResponse<T> {
  message: T
}

type ListPurchaseOrdersParams = {
  limit?: number
  offset?: number
  search?: string
  lifecycle?: 'draft' | 'submitted' | 'cancelled' | 'all'
  company?: string
}

const PURCHASE_ORDER_FIELDS = [
  'name',
  'supplier',
  'company',
  'transaction_date',
  'schedule_date',
  'currency',
  'buying_price_list',
  'set_warehouse',
  'status',
  'docstatus',
  'grand_total',
  'rounded_total',
  'per_received',
  'per_billed',
  'creation',
  'modified',
  'owner',
]

function cleanString(value?: string) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : undefined
}

function cleanNumber(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function buildFilters(params: ListPurchaseOrdersParams) {
  const filters: unknown[] = []

  if (params.lifecycle === 'draft') {
    filters.push(['Purchase Order', 'docstatus', '=', 0])
  }

  if (params.lifecycle === 'submitted') {
    filters.push(['Purchase Order', 'docstatus', '=', 1])
  }

  if (params.lifecycle === 'cancelled') {
    filters.push(['Purchase Order', 'docstatus', '=', 2])
  }

  if (params.company && params.company !== 'all') {
    filters.push(['Purchase Order', 'company', '=', params.company])
  }

  return filters
}

function buildOrFilters(search?: string) {
  const trimmed = search?.trim()

  if (!trimmed) {
    return []
  }

  return [
    ['Purchase Order', 'name', 'like', `%${trimmed}%`],
    ['Purchase Order', 'supplier', 'like', `%${trimmed}%`],
  ]
}

function normalizeOrderItems(items: PurchaseOrderFormItem[], fallbackScheduleDate?: string) {
  return items.map((item) => ({
    doctype: 'Purchase Order Item',
    item_code: item.item_code.trim(),
    item_name: item.item_name.trim(),
    description: cleanString(item.description),
    qty: item.qty,
    uom: item.uom.trim(),
    stock_uom: cleanString(item.stock_uom) ?? item.uom.trim(),
    conversion_factor: 1,
    rate: cleanNumber(item.rate),
    warehouse: cleanString(item.warehouse),
    schedule_date: cleanString(item.schedule_date) ?? cleanString(fallbackScheduleDate),
  }))
}

function toPurchaseOrderPayload(payload: PurchaseOrderFormValues) {
  return {
    supplier: payload.supplier.trim(),
    company: payload.company.trim(),
    transaction_date: payload.transaction_date,
    schedule_date: cleanString(payload.schedule_date),
    currency: payload.currency.trim(),
    buying_price_list: payload.buying_price_list.trim(),
    set_warehouse: cleanString(payload.set_warehouse),
    items: normalizeOrderItems(payload.items, payload.schedule_date),
  }
}

export function createEmptyPurchaseOrderItem(scheduleDate?: string): PurchaseOrderFormItem {
  return {
    item_code: '',
    item_name: '',
    description: '',
    qty: 1,
    uom: '',
    stock_uom: '',
    rate: undefined,
    warehouse: '',
    schedule_date: scheduleDate ?? '',
  }
}

function currentDateValue() {
  return formatDateInputValue()
}

export function purchaseOrderToFormValues(order?: PurchaseOrder): PurchaseOrderFormValues {
  return {
    supplier: order?.supplier ?? '',
    company: order?.company ?? '',
    transaction_date: order?.transaction_date ?? currentDateValue(),
    schedule_date: order?.schedule_date ?? '',
    currency: order?.currency ?? '',
    buying_price_list: order?.buying_price_list ?? '',
    set_warehouse: order?.set_warehouse ?? '',
    items:
      order?.items?.map((item) => ({
        item_code: item.item_code ?? '',
        item_name: item.item_name ?? '',
        description: item.description ?? '',
        qty: item.qty ?? 1,
        uom: item.uom ?? item.stock_uom ?? '',
        stock_uom: item.stock_uom ?? '',
        rate: item.rate,
        warehouse: item.warehouse ?? '',
        schedule_date: item.schedule_date ?? '',
      })) ?? [createEmptyPurchaseOrderItem(order?.schedule_date)],
  }
}

export async function listPurchaseOrders(params: ListPurchaseOrdersParams = {}): Promise<PurchaseOrderListResult> {
  const { limit = 20, offset = 0 } = params
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const response = await http.get<FrappeListResponse<PurchaseOrder>>('/resource/Purchase Order', {
    params: {
      fields: JSON.stringify(PURCHASE_ORDER_FIELDS),
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

export async function getPurchaseOrderSummary(params: ListPurchaseOrdersParams = {}) {
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const [totalCount, draftCount, submittedCount, cancelledCount] = await Promise.all([
    getResourceCount('Purchase Order', { filters, orFilters }),
    getResourceCount('Purchase Order', {
      filters: [...filters, ['Purchase Order', 'docstatus', '=', 0]],
      orFilters,
    }),
    getResourceCount('Purchase Order', {
      filters: [...filters, ['Purchase Order', 'docstatus', '=', 1]],
      orFilters,
    }),
    getResourceCount('Purchase Order', {
      filters: [...filters, ['Purchase Order', 'docstatus', '=', 2]],
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

export async function getPurchaseOrder(name: string) {
  const response = await http.get<FrappeDocResponse<PurchaseOrder>>(`/resource/Purchase Order/${encodeURIComponent(name)}`)
  return response.data.data
}

export async function createPurchaseOrder(payload: PurchaseOrderFormValues) {
  const response = await http.post<FrappeDocResponse<PurchaseOrder>>('/resource/Purchase Order', toPurchaseOrderPayload(payload))
  return response.data.data
}

export async function updatePurchaseOrder(name: string, payload: PurchaseOrderFormValues) {
  const response = await http.put<FrappeDocResponse<PurchaseOrder>>(
    `/resource/Purchase Order/${encodeURIComponent(name)}`,
    toPurchaseOrderPayload(payload),
  )

  return response.data.data
}

export async function submitPurchaseOrder(order: PurchaseOrder) {
  const response = await http.post<FrappeMethodResponse<PurchaseOrder>>('/method/frappe.client.submit', {
    doc: JSON.stringify(order),
  })

  return response.data.message
}

export async function cancelPurchaseOrder(order: PurchaseOrder) {
  const response = await http.post<FrappeMethodResponse<PurchaseOrder>>('/method/frappe.client.cancel', {
    doc: JSON.stringify(order),
  })

  return response.data.message
}

export async function getItemPrefill(itemCode: string) {
  const item = await getItem(itemCode)

  return {
    item_code: item.item_code || item.name,
    item_name: item.item_name || item.item_code || item.name,
    description: item.description || '',
    uom: item.stock_uom || '',
    stock_uom: item.stock_uom || '',
    rate: item.valuation_rate ?? item.standard_rate,
  }
}

export async function getDefaultPurchaseOrderContext() {
  const [companiesResponse, priceListsResponse] = await Promise.all([
    http.get<FrappeListResponse<{ name: string; default_currency?: string }>>('/resource/Company', {
      params: {
        fields: JSON.stringify(['name', 'default_currency']),
        limit_page_length: 5,
        order_by: 'modified desc',
      },
    }),
    http.get<FrappeListResponse<{ name: string; currency?: string; buying?: 0 | 1 }>>('/resource/Price List', {
      params: {
        fields: JSON.stringify(['name', 'currency', 'buying']),
        filters: JSON.stringify([['Price List', 'buying', '=', 1]]),
        limit_page_length: 5,
        order_by: 'modified desc',
      },
    }),
  ])

  return {
    companies: companiesResponse.data.data,
    priceLists: priceListsResponse.data.data,
  }
}



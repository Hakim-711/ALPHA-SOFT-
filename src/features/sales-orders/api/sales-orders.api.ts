import { http } from '@/core/api/http'
import { getResourceCount } from '@/core/api/resource'
import type { FrappeDocResponse, FrappeListResponse } from '@/core/api/types'
import { getItem } from '@/features/items/api/items.api'
import { formatDateInputValue } from '@/shared/utils/date'
import type { SalesOrder, SalesOrderFormItem, SalesOrderFormValues, SalesOrderListResult } from '../types/sales-order.types'

interface FrappeMethodResponse<T> {
  message: T
}

type ListSalesOrdersParams = {
  limit?: number
  offset?: number
  search?: string
  lifecycle?: 'draft' | 'submitted' | 'cancelled' | 'all'
  company?: string
}

const SALES_ORDER_FIELDS = [
  'name',
  'customer',
  'company',
  'transaction_date',
  'delivery_date',
  'currency',
  'selling_price_list',
  'set_warehouse',
  'status',
  'docstatus',
  'grand_total',
  'rounded_total',
  'per_delivered',
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

function buildFilters(params: ListSalesOrdersParams) {
  const filters: unknown[] = []

  if (params.lifecycle === 'draft') {
    filters.push(['Sales Order', 'docstatus', '=', 0])
  }

  if (params.lifecycle === 'submitted') {
    filters.push(['Sales Order', 'docstatus', '=', 1])
  }

  if (params.lifecycle === 'cancelled') {
    filters.push(['Sales Order', 'docstatus', '=', 2])
  }

  if (params.company && params.company !== 'all') {
    filters.push(['Sales Order', 'company', '=', params.company])
  }

  return filters
}

function buildOrFilters(search?: string) {
  const trimmed = search?.trim()

  if (!trimmed) {
    return []
  }

  return [
    ['Sales Order', 'name', 'like', `%${trimmed}%`],
    ['Sales Order', 'customer', 'like', `%${trimmed}%`],
  ]
}

function normalizeOrderItems(items: SalesOrderFormItem[], fallbackDeliveryDate?: string) {
  return items.map((item) => ({
    doctype: 'Sales Order Item',
    item_code: item.item_code.trim(),
    item_name: item.item_name.trim(),
    description: cleanString(item.description),
    qty: item.qty,
    uom: item.uom.trim(),
    stock_uom: cleanString(item.stock_uom) ?? item.uom.trim(),
    conversion_factor: 1,
    rate: cleanNumber(item.rate),
    warehouse: cleanString(item.warehouse),
    delivery_date: cleanString(item.delivery_date) ?? cleanString(fallbackDeliveryDate),
  }))
}

function toSalesOrderPayload(payload: SalesOrderFormValues) {
  return {
    customer: payload.customer.trim(),
    company: payload.company.trim(),
    transaction_date: payload.transaction_date,
    delivery_date: cleanString(payload.delivery_date),
    currency: payload.currency.trim(),
    selling_price_list: payload.selling_price_list.trim(),
    set_warehouse: cleanString(payload.set_warehouse),
    items: normalizeOrderItems(payload.items, payload.delivery_date),
  }
}

export function createEmptySalesOrderItem(deliveryDate?: string): SalesOrderFormItem {
  return {
    item_code: '',
    item_name: '',
    description: '',
    qty: 1,
    uom: '',
    stock_uom: '',
    rate: undefined,
    warehouse: '',
    delivery_date: deliveryDate ?? '',
  }
}

function currentDateValue() {
  return formatDateInputValue()
}

export function salesOrderToFormValues(order?: SalesOrder): SalesOrderFormValues {
  return {
    customer: order?.customer ?? '',
    company: order?.company ?? '',
    transaction_date: order?.transaction_date ?? currentDateValue(),
    delivery_date: order?.delivery_date ?? '',
    currency: order?.currency ?? '',
    selling_price_list: order?.selling_price_list ?? '',
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
        delivery_date: item.delivery_date ?? '',
      })) ?? [createEmptySalesOrderItem(order?.delivery_date)],
  }
}

export async function listSalesOrders(params: ListSalesOrdersParams = {}): Promise<SalesOrderListResult> {
  const { limit = 20, offset = 0 } = params
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const response = await http.get<FrappeListResponse<SalesOrder>>('/resource/Sales Order', {
    params: {
      fields: JSON.stringify(SALES_ORDER_FIELDS),
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

export async function getSalesOrderSummary(params: ListSalesOrdersParams = {}) {
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const [totalCount, draftCount, submittedCount, cancelledCount] = await Promise.all([
    getResourceCount('Sales Order', { filters, orFilters }),
    getResourceCount('Sales Order', {
      filters: [...filters, ['Sales Order', 'docstatus', '=', 0]],
      orFilters,
    }),
    getResourceCount('Sales Order', {
      filters: [...filters, ['Sales Order', 'docstatus', '=', 1]],
      orFilters,
    }),
    getResourceCount('Sales Order', {
      filters: [...filters, ['Sales Order', 'docstatus', '=', 2]],
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

export async function getSalesOrder(name: string) {
  const response = await http.get<FrappeDocResponse<SalesOrder>>(`/resource/Sales Order/${encodeURIComponent(name)}`)
  return response.data.data
}

export async function createSalesOrder(payload: SalesOrderFormValues) {
  const response = await http.post<FrappeDocResponse<SalesOrder>>('/resource/Sales Order', toSalesOrderPayload(payload))
  return response.data.data
}

export async function updateSalesOrder(name: string, payload: SalesOrderFormValues) {
  const response = await http.put<FrappeDocResponse<SalesOrder>>(
    `/resource/Sales Order/${encodeURIComponent(name)}`,
    toSalesOrderPayload(payload),
  )

  return response.data.data
}

export async function submitSalesOrder(order: SalesOrder) {
  const response = await http.post<FrappeMethodResponse<SalesOrder>>('/method/frappe.client.submit', {
    doc: JSON.stringify(order),
  })

  return response.data.message
}

export async function cancelSalesOrder(order: SalesOrder) {
  const response = await http.post<FrappeMethodResponse<SalesOrder>>('/method/frappe.client.cancel', {
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
    rate: item.standard_rate,
  }
}

export async function getDefaultSalesOrderContext() {
  const [companiesResponse, priceListsResponse] = await Promise.all([
    http.get<FrappeListResponse<{ name: string; default_currency?: string }>>('/resource/Company', {
      params: {
        fields: JSON.stringify(['name', 'default_currency']),
        limit_page_length: 5,
        order_by: 'modified desc',
      },
    }),
    http.get<FrappeListResponse<{ name: string; currency?: string; selling?: 0 | 1 }>>('/resource/Price List', {
      params: {
        fields: JSON.stringify(['name', 'currency', 'selling']),
        filters: JSON.stringify([['Price List', 'selling', '=', 1]]),
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

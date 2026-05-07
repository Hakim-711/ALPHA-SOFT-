import { http } from '@/core/api/http'
import { getResourceCount } from '@/core/api/resource'
import type { FrappeDocResponse, FrappeListResponse } from '@/core/api/types'
import type {
  Item,
  ItemBin,
  ItemFormValues,
  ItemListResult,
  ItemPrice,
  ItemRelatedDocuments,
  ItemStockLedgerEntry,
} from '../types/item.types'

type ListItemsParams = {
  limit?: number
  offset?: number
  search?: string
  itemGroup?: string
  stockMode?: 'stock' | 'non-stock' | 'all'
  status?: 'active' | 'disabled' | 'all'
}

const ITEM_FIELDS = [
  'name',
  'item_code',
  'item_name',
  'item_group',
  'stock_uom',
  'brand',
  'disabled',
  'is_stock_item',
  'has_variants',
  'is_sales_item',
  'is_purchase_item',
  'standard_rate',
  'valuation_rate',
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

function toItemPayload(payload: ItemFormValues) {
  return {
    item_code: payload.item_code.trim(),
    item_name: cleanString(payload.item_name),
    item_group: payload.item_group.trim(),
    stock_uom: payload.stock_uom.trim(),
    brand: cleanString(payload.brand),
    description: cleanString(payload.description),
    standard_rate: cleanNumber(payload.standard_rate),
    valuation_rate: cleanNumber(payload.valuation_rate),
    disabled: payload.disabled ? 1 : 0,
    is_stock_item: payload.is_stock_item ? 1 : 0,
    is_sales_item: payload.is_sales_item ? 1 : 0,
    is_purchase_item: payload.is_purchase_item ? 1 : 0,
  }
}

function buildFilters(params: ListItemsParams) {
  const filters: unknown[] = []

  if (params.itemGroup && params.itemGroup !== 'all') {
    filters.push(['Item', 'item_group', '=', params.itemGroup])
  }

  if (params.status === 'active') {
    filters.push(['Item', 'disabled', '=', 0])
  }

  if (params.status === 'disabled') {
    filters.push(['Item', 'disabled', '=', 1])
  }

  if (params.stockMode === 'stock') {
    filters.push(['Item', 'is_stock_item', '=', 1])
  }

  if (params.stockMode === 'non-stock') {
    filters.push(['Item', 'is_stock_item', '=', 0])
  }

  return filters
}

function buildOrFilters(search?: string) {
  const trimmed = search?.trim()

  if (!trimmed) {
    return []
  }

  return [
    ['Item', 'item_code', 'like', `%${trimmed}%`],
    ['Item', 'item_name', 'like', `%${trimmed}%`],
  ]
}

export function itemToFormValues(item?: Item): ItemFormValues {
  return {
    item_code: item?.item_code ?? '',
    item_name: item?.item_name ?? '',
    item_group: item?.item_group ?? '',
    stock_uom: item?.stock_uom ?? '',
    brand: item?.brand ?? '',
    description: item?.description ?? '',
    standard_rate: item?.standard_rate,
    valuation_rate: item?.valuation_rate,
    disabled: item?.disabled === 1,
    is_stock_item: item?.is_stock_item !== 0,
    is_sales_item: item?.is_sales_item !== 0,
    is_purchase_item: item?.is_purchase_item !== 0,
  }
}

export async function listItems(params: ListItemsParams = {}): Promise<ItemListResult> {
  const { limit = 20, offset = 0 } = params
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const response = await http.get<FrappeListResponse<Item>>('/resource/Item', {
    params: {
      fields: JSON.stringify(ITEM_FIELDS),
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

export async function getItemSummary(params: ListItemsParams = {}) {
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const [totalCount, activeCount, stockCount, disabledCount] = await Promise.all([
    getResourceCount('Item', { filters, orFilters }),
    getResourceCount('Item', {
      filters: [...filters, ['Item', 'disabled', '=', 0]],
      orFilters,
    }),
    getResourceCount('Item', {
      filters: [...filters, ['Item', 'is_stock_item', '=', 1]],
      orFilters,
    }),
    getResourceCount('Item', {
      filters: [...filters, ['Item', 'disabled', '=', 1]],
      orFilters,
    }),
  ])

  return {
    totalCount,
    activeCount,
    stockCount,
    disabledCount,
  }
}

export async function getItem(name: string) {
  const response = await http.get<FrappeDocResponse<Item>>(`/resource/Item/${encodeURIComponent(name)}`)
  return response.data.data
}

export async function createItem(payload: ItemFormValues) {
  const response = await http.post<FrappeDocResponse<Item>>('/resource/Item', toItemPayload(payload))
  return response.data.data
}

export async function updateItem(name: string, payload: ItemFormValues) {
  const response = await http.put<FrappeDocResponse<Item>>(`/resource/Item/${encodeURIComponent(name)}`, toItemPayload(payload))
  return response.data.data
}

export async function setItemDisabled(name: string, disabled: boolean) {
  const response = await http.put<FrappeDocResponse<Item>>(`/resource/Item/${encodeURIComponent(name)}`, {
    disabled: disabled ? 1 : 0,
  })

  return response.data.data
}

async function listRelatedResource<T>(doctype: string, filters: unknown[], fields: string[]) {
  const response = await http.get<FrappeListResponse<T>>(`/resource/${encodeURIComponent(doctype)}`, {
    params: {
      fields: JSON.stringify(fields),
      filters: JSON.stringify(filters),
      limit_page_length: 6,
      order_by: 'modified desc',
    },
  })

  return response.data.data
}

async function safeListRelatedResource<T>(doctype: string, filters: unknown[], fields: string[]) {
  try {
    return await listRelatedResource<T>(doctype, filters, fields)
  } catch {
    return []
  }
}

export async function listItemRelatedDocuments(itemCode: string): Promise<ItemRelatedDocuments> {
  const [prices, bins, stockLedger] = await Promise.all([
    safeListRelatedResource<ItemPrice>('Item Price', [['Item Price', 'item_code', '=', itemCode]], [
      'name',
      'price_list',
      'price_list_rate',
      'currency',
      'selling',
      'buying',
    ]),
    safeListRelatedResource<ItemBin>('Bin', [['Bin', 'item_code', '=', itemCode]], [
      'name',
      'warehouse',
      'actual_qty',
      'reserved_qty',
      'projected_qty',
    ]),
    safeListRelatedResource<ItemStockLedgerEntry>('Stock Ledger Entry', [['Stock Ledger Entry', 'item_code', '=', itemCode]], [
      'name',
      'posting_date',
      'warehouse',
      'actual_qty',
      'qty_after_transaction',
      'voucher_type',
      'voucher_no',
    ]),
  ])

  return {
    prices,
    bins,
    stockLedger,
  }
}

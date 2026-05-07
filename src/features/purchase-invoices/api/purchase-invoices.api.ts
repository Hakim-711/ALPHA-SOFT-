import { http } from '@/core/api/http'
import { getResourceCount } from '@/core/api/resource'
import type { FrappeDocResponse, FrappeListResponse } from '@/core/api/types'
import { getItem } from '@/features/items/api/items.api'
import { formatDateInputValue } from '@/shared/utils/date'
import type {
  PurchaseInvoice,
  PurchaseInvoiceAccountOption,
  PurchaseInvoiceDefaults,
  PurchaseInvoiceFormItem,
  PurchaseInvoiceFormValues,
  PurchaseInvoiceListResult,
} from '../types/purchase-invoice.types'

interface FrappeMethodResponse<T> {
  message: T
}

type ListPurchaseInvoicesParams = {
  limit?: number
  offset?: number
  search?: string
  lifecycle?: 'draft' | 'submitted' | 'cancelled' | 'all'
  company?: string
}

const PURCHASE_INVOICE_FIELDS = [
  'name',
  'supplier',
  'supplier_name',
  'company',
  'posting_date',
  'due_date',
  'currency',
  'conversion_rate',
  'buying_price_list',
  'set_warehouse',
  'credit_to',
  'update_stock',
  'is_return',
  'return_against',
  'remarks',
  'status',
  'docstatus',
  'grand_total',
  'rounded_total',
  'outstanding_amount',
  'total',
  'net_total',
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

function buildFilters(params: ListPurchaseInvoicesParams) {
  const filters: unknown[] = []

  if (params.lifecycle === 'draft') {
    filters.push(['Purchase Invoice', 'docstatus', '=', 0])
  }

  if (params.lifecycle === 'submitted') {
    filters.push(['Purchase Invoice', 'docstatus', '=', 1])
  }

  if (params.lifecycle === 'cancelled') {
    filters.push(['Purchase Invoice', 'docstatus', '=', 2])
  }

  if (params.company && params.company !== 'all') {
    filters.push(['Purchase Invoice', 'company', '=', params.company])
  }

  return filters
}

function buildOrFilters(search?: string) {
  const trimmed = search?.trim()

  if (!trimmed) {
    return []
  }

  return [
    ['Purchase Invoice', 'name', 'like', `%${trimmed}%`],
    ['Purchase Invoice', 'supplier', 'like', `%${trimmed}%`],
    ['Purchase Invoice', 'supplier_name', 'like', `%${trimmed}%`],
  ]
}

function normalizeInvoiceItems(items: PurchaseInvoiceFormItem[]) {
  return items.map((item) => ({
    doctype: 'Purchase Invoice Item',
    item_code: item.item_code.trim(),
    item_name: item.item_name.trim(),
    description: cleanString(item.description),
    qty: item.qty,
    uom: item.uom.trim(),
    stock_uom: cleanString(item.stock_uom) ?? item.uom.trim(),
    conversion_factor: 1,
    rate: cleanNumber(item.rate),
    warehouse: cleanString(item.warehouse),
    purchase_order: cleanString(item.purchase_order),
  }))
}

function toPurchaseInvoicePayload(payload: PurchaseInvoiceFormValues) {
  return {
    supplier: payload.supplier.trim(),
    company: payload.company.trim(),
    posting_date: payload.posting_date,
    due_date: cleanString(payload.due_date) ?? payload.posting_date,
    currency: payload.currency.trim(),
    conversion_rate: cleanNumber(payload.conversion_rate) ?? 1,
    buying_price_list: payload.buying_price_list.trim(),
    set_warehouse: cleanString(payload.set_warehouse),
    credit_to: payload.credit_to?.trim(),
    update_stock: payload.update_stock ? 1 : 0,
    remarks: cleanString(payload.remarks),
    items: normalizeInvoiceItems(payload.items),
  }
}

export function createEmptyPurchaseInvoiceItem(): PurchaseInvoiceFormItem {
  return {
    item_code: '',
    item_name: '',
    description: '',
    qty: 1,
    uom: '',
    stock_uom: '',
    rate: undefined,
    warehouse: '',
    purchase_order: '',
  }
}

function currentDateValue() {
  return formatDateInputValue()
}

export function purchaseInvoiceToFormValues(invoice?: PurchaseInvoice): PurchaseInvoiceFormValues {
  return {
    supplier: invoice?.supplier ?? '',
    company: invoice?.company ?? '',
    posting_date: invoice?.posting_date ?? currentDateValue(),
    due_date: invoice?.due_date ?? invoice?.posting_date ?? currentDateValue(),
    currency: invoice?.currency ?? '',
    conversion_rate: invoice?.conversion_rate ?? 1,
    buying_price_list: invoice?.buying_price_list ?? '',
    set_warehouse: invoice?.set_warehouse ?? '',
    credit_to: invoice?.credit_to ?? '',
    update_stock: invoice?.update_stock === 1,
    remarks: invoice?.remarks ?? '',
    items:
      invoice?.items?.map((item) => ({
        item_code: item.item_code ?? '',
        item_name: item.item_name ?? '',
        description: item.description ?? '',
        qty: item.qty ?? 1,
        uom: item.uom ?? item.stock_uom ?? '',
        stock_uom: item.stock_uom ?? '',
        rate: item.rate,
        warehouse: item.warehouse ?? '',
        purchase_order: item.purchase_order ?? '',
      })) ?? [createEmptyPurchaseInvoiceItem()],
  }
}

export async function listPurchaseInvoices(params: ListPurchaseInvoicesParams = {}): Promise<PurchaseInvoiceListResult> {
  const { limit = 20, offset = 0 } = params
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const response = await http.get<FrappeListResponse<PurchaseInvoice>>('/resource/Purchase Invoice', {
    params: {
      fields: JSON.stringify(PURCHASE_INVOICE_FIELDS),
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

export async function getPurchaseInvoiceSummary(params: ListPurchaseInvoicesParams = {}) {
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const [totalCount, draftCount, submittedCount, cancelledCount] = await Promise.all([
    getResourceCount('Purchase Invoice', { filters, orFilters }),
    getResourceCount('Purchase Invoice', {
      filters: [...filters, ['Purchase Invoice', 'docstatus', '=', 0]],
      orFilters,
    }),
    getResourceCount('Purchase Invoice', {
      filters: [...filters, ['Purchase Invoice', 'docstatus', '=', 1]],
      orFilters,
    }),
    getResourceCount('Purchase Invoice', {
      filters: [...filters, ['Purchase Invoice', 'docstatus', '=', 2]],
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

export async function getPurchaseInvoice(name: string) {
  const response = await http.get<FrappeDocResponse<PurchaseInvoice>>(`/resource/Purchase Invoice/${encodeURIComponent(name)}`)
  return response.data.data
}

export async function createPurchaseInvoice(payload: PurchaseInvoiceFormValues) {
  const response = await http.post<FrappeDocResponse<PurchaseInvoice>>('/resource/Purchase Invoice', toPurchaseInvoicePayload(payload))
  return response.data.data
}

export async function updatePurchaseInvoice(name: string, payload: PurchaseInvoiceFormValues) {
  const response = await http.put<FrappeDocResponse<PurchaseInvoice>>(
    `/resource/Purchase Invoice/${encodeURIComponent(name)}`,
    toPurchaseInvoicePayload(payload),
  )

  return response.data.data
}

export async function submitPurchaseInvoice(invoice: PurchaseInvoice) {
  const response = await http.post<FrappeMethodResponse<PurchaseInvoice>>('/method/frappe.client.submit', {
    doc: JSON.stringify(invoice),
  })

  return response.data.message
}

export async function cancelPurchaseInvoice(invoice: PurchaseInvoice) {
  const response = await http.post<FrappeMethodResponse<PurchaseInvoice>>('/method/frappe.client.cancel', {
    doc: JSON.stringify(invoice),
  })

  return response.data.message
}

export async function getPurchaseInvoiceItemPrefill(itemCode: string) {
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

export async function getDefaultPurchaseInvoiceContext(): Promise<PurchaseInvoiceDefaults> {
  const [companiesResponse, priceListsResponse, accountsResponse] = await Promise.all([
    http.get<
      FrappeListResponse<{
        name: string
        default_currency?: string
        default_payable_account?: string
        default_cash_account?: string
        default_bank_account?: string
      }>
    >('/resource/Company', {
      params: {
        fields: JSON.stringify(['name', 'default_currency', 'default_payable_account', 'default_cash_account', 'default_bank_account']),
        limit_page_length: 20,
        order_by: 'modified desc',
      },
    }),
    http.get<FrappeListResponse<{ name: string; currency?: string; buying?: 0 | 1 }>>('/resource/Price List', {
      params: {
        fields: JSON.stringify(['name', 'currency', 'buying']),
        filters: JSON.stringify([['Price List', 'buying', '=', 1]]),
        limit_page_length: 20,
        order_by: 'modified desc',
      },
    }),
    http.get<FrappeListResponse<PurchaseInvoiceAccountOption>>('/resource/Account', {
      params: {
        fields: JSON.stringify(['name', 'company', 'account_type', 'account_currency', 'disabled', 'is_group']),
        filters: JSON.stringify([
          ['Account', 'account_type', 'in', ['Payable', 'Cash', 'Bank']],
          ['Account', 'is_group', '=', 0],
          ['Account', 'disabled', '=', 0],
        ]),
        limit_page_length: 100,
        order_by: 'name asc',
      },
    }),
  ])

  return {
    companies: companiesResponse.data.data,
    priceLists: priceListsResponse.data.data,
    payableAccounts: accountsResponse.data.data.filter((account) => account.account_type === 'Payable'),
  }
}

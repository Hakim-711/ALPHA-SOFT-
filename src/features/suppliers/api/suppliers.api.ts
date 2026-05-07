import { http } from '@/core/api/http'
import { getResourceCount } from '@/core/api/resource'
import type { FrappeListResponse } from '@/core/api/types'
import type {
  RelatedSupplierDocument,
  Supplier,
  SupplierFormValues,
  SupplierListResult,
  SupplierRelatedDocuments,
} from '../types/supplier.types'

interface FrappeMethodResponse<T> {
  message: T
}

type ListSuppliersParams = {
  limit?: number
  offset?: number
  search?: string
  supplierType?: string
  status?: 'active' | 'disabled' | 'all'
}

const SUPPLIER_FIELDS = [
  'name',
  'supplier_name',
  'supplier_type',
  'supplier_group',
  'country',
  'default_currency',
  'payment_terms',
  'website',
  'mobile_no',
  'email_id',
  'tax_id',
  'supplier_primary_address',
  'disabled',
  'creation',
  'modified',
  'owner',
]

function cleanString(value?: string) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : undefined
}

function toSupplierPayload(payload: SupplierFormValues) {
  return {
    supplier_name: payload.supplier_name.trim(),
    supplier_type: payload.supplier_type,
    supplier_group: cleanString(payload.supplier_group),
    country: cleanString(payload.country),
    default_currency: cleanString(payload.default_currency),
    payment_terms: cleanString(payload.payment_terms),
    website: cleanString(payload.website),
    mobile_no: cleanString(payload.mobile_no),
    email_id: cleanString(payload.email_id),
    tax_id: cleanString(payload.tax_id),
    supplier_primary_address: cleanString(payload.address),
    supplier_details: cleanString(payload.supplier_details),
    disabled: payload.disabled ? 1 : 0,
  }
}

function buildFilters(params: ListSuppliersParams) {
  const filters: unknown[] = []

  if (params.supplierType && params.supplierType !== 'all') {
    filters.push(['Supplier', 'supplier_type', '=', params.supplierType])
  }

  if (params.status === 'active') {
    filters.push(['Supplier', 'disabled', '=', 0])
  }

  if (params.status === 'disabled') {
    filters.push(['Supplier', 'disabled', '=', 1])
  }

  return filters
}

function buildOrFilters(search?: string) {
  const trimmed = search?.trim()

  if (!trimmed) {
    return []
  }

  return [
    ['Supplier', 'name', 'like', `%${trimmed}%`],
    ['Supplier', 'supplier_name', 'like', `%${trimmed}%`],
    ['Supplier', 'mobile_no', 'like', `%${trimmed}%`],
    ['Supplier', 'email_id', 'like', `%${trimmed}%`],
  ]
}

export function supplierToFormValues(supplier?: Supplier): SupplierFormValues {
  return {
    supplier_name: supplier?.supplier_name ?? '',
    supplier_type: supplier?.supplier_type === 'Individual' ? 'Individual' : 'Company',
    supplier_group: supplier?.supplier_group ?? '',
    country: supplier?.country ?? '',
    default_currency: supplier?.default_currency ?? '',
    payment_terms: supplier?.payment_terms ?? '',
    website: supplier?.website ?? '',
    mobile_no: supplier?.mobile_no ?? '',
    email_id: supplier?.email_id ?? '',
    tax_id: supplier?.tax_id ?? '',
    address: supplier?.supplier_primary_address ?? supplier?.primary_address ?? supplier?.address ?? '',
    supplier_details: supplier?.supplier_details ?? '',
    disabled: supplier?.disabled === 1,
  }
}

export async function listSuppliers(params: ListSuppliersParams = {}): Promise<SupplierListResult> {
  const { limit = 20, offset = 0 } = params
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const response = await http.get<FrappeListResponse<Supplier>>('/resource/Supplier', {
    params: {
      fields: JSON.stringify(SUPPLIER_FIELDS),
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

export async function getSupplierSummary(params: ListSuppliersParams = {}) {
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const [totalCount, activeCount, disabledCount, companyCount] = await Promise.all([
    getResourceCount('Supplier', { filters, orFilters }),
    getResourceCount('Supplier', {
      filters: [...filters, ['Supplier', 'disabled', '=', 0]],
      orFilters,
    }),
    getResourceCount('Supplier', {
      filters: [...filters, ['Supplier', 'disabled', '=', 1]],
      orFilters,
    }),
    getResourceCount('Supplier', {
      filters: [...filters, ['Supplier', 'supplier_type', '=', 'Company']],
      orFilters,
    }),
  ])

  return {
    totalCount,
    activeCount,
    disabledCount,
    companyCount,
  }
}

export async function getSupplier(name: string) {
  const response = await http.get<FrappeMethodResponse<Supplier>>('/method/frappe.client.get', {
    params: {
      doctype: 'Supplier',
      name,
    },
  })

  return response.data.message
}

export async function createSupplier(payload: SupplierFormValues) {
  const response = await http.post<FrappeMethodResponse<Supplier>>('/method/frappe.client.insert', {
    doc: {
      doctype: 'Supplier',
      ...toSupplierPayload(payload),
    },
  })

  return response.data.message
}

export async function updateSupplier(name: string, payload: SupplierFormValues) {
  const current = await getSupplier(name)
  const response = await http.post<FrappeMethodResponse<Supplier>>('/method/frappe.client.save', {
    doc: JSON.stringify({
      ...current,
      ...toSupplierPayload(payload),
      doctype: 'Supplier',
      name,
    }),
  })

  return response.data.message
}

export async function setSupplierDisabled(name: string, disabled: boolean) {
  const current = await getSupplier(name)
  const response = await http.post<FrappeMethodResponse<Supplier>>('/method/frappe.client.save', {
    doc: JSON.stringify({
      ...current,
      doctype: 'Supplier',
      name,
      disabled: disabled ? 1 : 0,
    }),
  })

  return response.data.message
}

async function listRelatedDocuments(doctype: string, filters: unknown[], fields: string[]) {
  const response = await http.get<FrappeListResponse<RelatedSupplierDocument>>(`/resource/${encodeURIComponent(doctype)}`, {
    params: {
      fields: JSON.stringify(fields),
      filters: JSON.stringify(filters),
      limit_page_length: 6,
      order_by: 'modified desc',
    },
  })

  return response.data.data
}

export async function listSupplierRelatedDocuments(supplierName: string): Promise<SupplierRelatedDocuments> {
  const [purchaseOrders, purchaseInvoices, payments] = await Promise.all([
    listRelatedDocuments('Purchase Order', [['Purchase Order', 'supplier', '=', supplierName]], [
      'name',
      'status',
      'transaction_date',
      'grand_total',
    ]),
    listRelatedDocuments('Purchase Invoice', [['Purchase Invoice', 'supplier', '=', supplierName]], [
      'name',
      'status',
      'posting_date',
      'grand_total',
      'outstanding_amount',
    ]),
    listRelatedDocuments(
      'Payment Entry',
      [
        ['Payment Entry', 'party_type', '=', 'Supplier'],
        ['Payment Entry', 'party', '=', supplierName],
      ],
      ['name', 'status', 'posting_date', 'paid_amount'],
    ),
  ])

  return {
    purchaseOrders,
    purchaseInvoices,
    payments,
  }
}

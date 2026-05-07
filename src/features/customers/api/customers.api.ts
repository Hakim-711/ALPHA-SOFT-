import { http } from '@/core/api/http'
import { getResourceCount } from '@/core/api/resource'
import type { FrappeDocResponse, FrappeListResponse } from '@/core/api/types'
import type {
  Customer,
  CustomerFormValues,
  CustomerListResult,
  CustomerRelatedDocuments,
  RelatedCustomerDocument,
} from '../types/customer.types'

type ListCustomersParams = {
  limit?: number
  offset?: number
  search?: string
  customerType?: string
  status?: 'active' | 'disabled' | 'all'
}

const CUSTOMER_FIELDS = [
  'name',
  'customer_name',
  'customer_type',
  'customer_group',
  'territory',
  'mobile_no',
  'email_id',
  'tax_id',
  'customer_primary_address',
  'disabled',
  'creation',
  'modified',
  'owner',
]

function cleanString(value?: string) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : undefined
}

function toCustomerPayload(payload: CustomerFormValues) {
  return {
    customer_name: payload.customer_name.trim(),
    customer_type: payload.customer_type,
    customer_group: cleanString(payload.customer_group),
    territory: cleanString(payload.territory),
    mobile_no: cleanString(payload.mobile_no),
    email_id: cleanString(payload.email_id),
    tax_id: cleanString(payload.tax_id),
    customer_primary_address: cleanString(payload.address),
    customer_details: cleanString(payload.customer_details),
    disabled: payload.disabled ? 1 : 0,
  }
}

function buildFilters(params: ListCustomersParams) {
  const filters: unknown[] = []

  if (params.customerType && params.customerType !== 'all') {
    filters.push(['Customer', 'customer_type', '=', params.customerType])
  }

  if (params.status === 'active') {
    filters.push(['Customer', 'disabled', '=', 0])
  }

  if (params.status === 'disabled') {
    filters.push(['Customer', 'disabled', '=', 1])
  }

  return filters
}

function buildOrFilters(search?: string) {
  const trimmed = search?.trim()

  if (!trimmed) {
    return []
  }

  return [
    ['Customer', 'name', 'like', `%${trimmed}%`],
    ['Customer', 'customer_name', 'like', `%${trimmed}%`],
    ['Customer', 'mobile_no', 'like', `%${trimmed}%`],
    ['Customer', 'email_id', 'like', `%${trimmed}%`],
  ]
}

export function customerToFormValues(customer?: Customer): CustomerFormValues {
  return {
    customer_name: customer?.customer_name ?? '',
    customer_type: customer?.customer_type === 'Company' ? 'Company' : 'Individual',
    customer_group: customer?.customer_group ?? '',
    territory: customer?.territory ?? '',
    mobile_no: customer?.mobile_no ?? '',
    email_id: customer?.email_id ?? '',
    tax_id: customer?.tax_id ?? '',
    address: customer?.customer_primary_address ?? customer?.primary_address ?? customer?.address ?? '',
    customer_details: customer?.customer_details ?? '',
    disabled: customer?.disabled === 1,
  }
}

export async function listCustomers(params: ListCustomersParams = {}): Promise<CustomerListResult> {
  const { limit = 20, offset = 0 } = params
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const response = await http.get<FrappeListResponse<Customer>>('/resource/Customer', {
    params: {
      fields: JSON.stringify(CUSTOMER_FIELDS),
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

export async function getCustomerSummary(params: ListCustomersParams = {}) {
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const [totalCount, activeCount, disabledCount, companyCount] = await Promise.all([
    getResourceCount('Customer', { filters, orFilters }),
    getResourceCount('Customer', {
      filters: [...filters, ['Customer', 'disabled', '=', 0]],
      orFilters,
    }),
    getResourceCount('Customer', {
      filters: [...filters, ['Customer', 'disabled', '=', 1]],
      orFilters,
    }),
    getResourceCount('Customer', {
      filters: [...filters, ['Customer', 'customer_type', '=', 'Company']],
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

export async function getCustomer(name: string) {
  const response = await http.get<FrappeDocResponse<Customer>>(`/resource/Customer/${encodeURIComponent(name)}`)
  return response.data.data
}

export async function createCustomer(payload: CustomerFormValues) {
  const response = await http.post<FrappeDocResponse<Customer>>('/resource/Customer', toCustomerPayload(payload))
  return response.data.data
}

export async function updateCustomer(name: string, payload: CustomerFormValues) {
  const response = await http.put<FrappeDocResponse<Customer>>(
    `/resource/Customer/${encodeURIComponent(name)}`,
    toCustomerPayload(payload),
  )

  return response.data.data
}

export async function setCustomerDisabled(name: string, disabled: boolean) {
  const response = await http.put<FrappeDocResponse<Customer>>(`/resource/Customer/${encodeURIComponent(name)}`, {
    disabled: disabled ? 1 : 0,
  })

  return response.data.data
}

async function listRelatedDocuments(doctype: string, filters: unknown[], fields: string[]) {
  const response = await http.get<FrappeListResponse<RelatedCustomerDocument>>(`/resource/${encodeURIComponent(doctype)}`, {
    params: {
      fields: JSON.stringify(fields),
      filters: JSON.stringify(filters),
      limit_page_length: 6,
      order_by: 'modified desc',
    },
  })

  return response.data.data
}

export async function listCustomerRelatedDocuments(customerName: string): Promise<CustomerRelatedDocuments> {
  const [salesInvoices, salesOrders, payments] = await Promise.all([
    listRelatedDocuments('Sales Invoice', [['Sales Invoice', 'customer', '=', customerName]], [
      'name',
      'status',
      'posting_date',
      'grand_total',
      'outstanding_amount',
    ]),
    listRelatedDocuments('Sales Order', [['Sales Order', 'customer', '=', customerName]], [
      'name',
      'status',
      'transaction_date',
      'grand_total',
    ]),
    listRelatedDocuments(
      'Payment Entry',
      [
        ['Payment Entry', 'party_type', '=', 'Customer'],
        ['Payment Entry', 'party', '=', customerName],
      ],
      ['name', 'status', 'posting_date', 'paid_amount'],
    ),
  ])

  return {
    salesInvoices,
    salesOrders,
    payments,
  }
}

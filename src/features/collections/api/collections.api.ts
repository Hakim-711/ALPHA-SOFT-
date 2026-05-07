import { http } from '@/core/api/http'
import { getResourceCount } from '@/core/api/resource'
import type { FrappeDocResponse, FrappeListResponse } from '@/core/api/types'
import { formatDateInputValue } from '@/shared/utils/date'
import type {
  Collection,
  CollectionAccountOption,
  CollectionDefaults,
  CollectionFormReference,
  CollectionFormValues,
  CollectionListResult,
  CollectionOutstandingInvoice,
} from '../types/collection.types'

interface FrappeMethodResponse<T> {
  message: T
}

type ListCollectionsParams = {
  limit?: number
  offset?: number
  search?: string
  lifecycle?: 'draft' | 'submitted' | 'cancelled' | 'all'
  company?: string
}

const COLLECTION_FIELDS = [
  'name',
  'posting_date',
  'company',
  'payment_type',
  'party_type',
  'party',
  'party_name',
  'paid_from',
  'paid_to',
  'paid_from_account_currency',
  'paid_to_account_currency',
  'paid_amount',
  'received_amount',
  'source_exchange_rate',
  'target_exchange_rate',
  'total_allocated_amount',
  'unallocated_amount',
  'difference_amount',
  'mode_of_payment',
  'reference_no',
  'status',
  'docstatus',
  'creation',
  'modified',
  'owner',
]

function cleanString(value?: string) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : undefined
}

function buildFilters(params: ListCollectionsParams) {
  const filters: unknown[] = [
    ['Payment Entry', 'payment_type', '=', 'Receive'],
    ['Payment Entry', 'party_type', '=', 'Customer'],
  ]

  if (params.lifecycle === 'draft') {
    filters.push(['Payment Entry', 'docstatus', '=', 0])
  }

  if (params.lifecycle === 'submitted') {
    filters.push(['Payment Entry', 'docstatus', '=', 1])
  }

  if (params.lifecycle === 'cancelled') {
    filters.push(['Payment Entry', 'docstatus', '=', 2])
  }

  if (params.company && params.company !== 'all') {
    filters.push(['Payment Entry', 'company', '=', params.company])
  }

  return filters
}

function buildOrFilters(search?: string) {
  const trimmed = search?.trim()

  if (!trimmed) {
    return []
  }

  return [
    ['Payment Entry', 'name', 'like', `%${trimmed}%`],
    ['Payment Entry', 'party', 'like', `%${trimmed}%`],
    ['Payment Entry', 'party_name', 'like', `%${trimmed}%`],
    ['Payment Entry', 'reference_no', 'like', `%${trimmed}%`],
  ]
}

function normalizeReferences(references: CollectionFormReference[]) {
  return references
    .filter((reference) => reference.reference_name.trim() && reference.allocated_amount > 0)
    .map((reference) => ({
      doctype: 'Payment Entry Reference',
      reference_doctype: 'Sales Invoice',
      reference_name: reference.reference_name.trim(),
      allocated_amount: reference.allocated_amount,
    }))
}

function toCollectionPayload(payload: CollectionFormValues) {
  return {
    payment_type: 'Receive',
    party_type: 'Customer',
    company: payload.company.trim(),
    posting_date: payload.posting_date,
    party: payload.customer.trim(),
    paid_from: payload.paid_from.trim(),
    paid_to: payload.paid_to.trim(),
    paid_amount: payload.paid_amount,
    received_amount: payload.received_amount,
    source_exchange_rate: payload.source_exchange_rate,
    target_exchange_rate: payload.target_exchange_rate,
    mode_of_payment: cleanString(payload.mode_of_payment),
    reference_no: cleanString(payload.reference_no),
    reference_date: cleanString(payload.reference_date),
    remarks: cleanString(payload.remarks),
    references: normalizeReferences(payload.references),
  }
}

export function collectionToFormValues(collection?: Collection): CollectionFormValues {
  return {
    company: collection?.company ?? '',
    posting_date: collection?.posting_date ?? formatDateInputValue(),
    customer: collection?.party ?? '',
    paid_from: collection?.paid_from ?? '',
    paid_to: collection?.paid_to ?? '',
    paid_amount: collection?.paid_amount ?? 0,
    received_amount: collection?.received_amount ?? 0,
    source_exchange_rate: collection?.source_exchange_rate ?? 1,
    target_exchange_rate: collection?.target_exchange_rate ?? 1,
    mode_of_payment: collection?.mode_of_payment ?? '',
    reference_no: collection?.reference_no ?? '',
    reference_date: collection?.reference_date ?? '',
    remarks: collection?.remarks ?? '',
    references:
      collection?.references?.map((reference) => ({
        reference_name: reference.reference_name,
        due_date: reference.due_date ?? '',
        total_amount: reference.total_amount,
        outstanding_amount: reference.outstanding_amount,
        allocated_amount: reference.allocated_amount ?? 0,
      })) ?? [],
  }
}

export function createReferenceFromInvoice(invoice: CollectionOutstandingInvoice): CollectionFormReference {
  return {
    reference_name: invoice.name,
    due_date: invoice.due_date ?? '',
    total_amount: invoice.grand_total,
    outstanding_amount: invoice.outstanding_amount,
    allocated_amount: invoice.outstanding_amount ?? 0,
    invoice_currency: invoice.currency,
    debit_to: invoice.debit_to,
  }
}

export async function listCollections(params: ListCollectionsParams = {}): Promise<CollectionListResult> {
  const { limit = 20, offset = 0 } = params
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const response = await http.get<FrappeListResponse<Collection>>('/resource/Payment Entry', {
    params: {
      fields: JSON.stringify(COLLECTION_FIELDS),
      limit_start: offset,
      limit_page_length: limit + 1,
      order_by: 'modified desc',
      filters: JSON.stringify(filters),
      ...(orFilters.length > 0 ? { or_filters: JSON.stringify(orFilters) } : {}),
    },
  })

  return {
    rows: response.data.data.slice(0, limit),
    hasNextPage: response.data.data.length > limit,
  }
}

export async function getCollectionSummary(params: ListCollectionsParams = {}) {
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const [totalCount, draftCount, submittedCount, cancelledCount] = await Promise.all([
    getResourceCount('Payment Entry', { filters, orFilters }),
    getResourceCount('Payment Entry', {
      filters: [...filters, ['Payment Entry', 'docstatus', '=', 0]],
      orFilters,
    }),
    getResourceCount('Payment Entry', {
      filters: [...filters, ['Payment Entry', 'docstatus', '=', 1]],
      orFilters,
    }),
    getResourceCount('Payment Entry', {
      filters: [...filters, ['Payment Entry', 'docstatus', '=', 2]],
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

export async function getCollection(name: string) {
  const response = await http.get<FrappeDocResponse<Collection>>(`/resource/Payment Entry/${encodeURIComponent(name)}`)
  return response.data.data
}

export async function createCollection(payload: CollectionFormValues) {
  const response = await http.post<FrappeDocResponse<Collection>>('/resource/Payment Entry', toCollectionPayload(payload))
  return response.data.data
}

export async function updateCollection(name: string, payload: CollectionFormValues) {
  const response = await http.put<FrappeDocResponse<Collection>>(
    `/resource/Payment Entry/${encodeURIComponent(name)}`,
    toCollectionPayload(payload),
  )

  return response.data.data
}

export async function submitCollection(collection: Collection) {
  const response = await http.post<FrappeMethodResponse<Collection>>('/method/frappe.client.submit', {
    doc: JSON.stringify(collection),
  })

  return response.data.message
}

export async function cancelCollection(collection: Collection) {
  const response = await http.post<FrappeMethodResponse<Collection>>('/method/frappe.client.cancel', {
    doc: JSON.stringify(collection),
  })

  return response.data.message
}

export async function getCollectionDefaults(): Promise<CollectionDefaults> {
  const [companiesResponse, accountsResponse, modesResponse] = await Promise.all([
    http.get<
      FrappeListResponse<{
        name: string
        default_currency?: string
        default_receivable_account?: string
        default_cash_account?: string
        default_bank_account?: string
      }>
    >('/resource/Company', {
      params: {
        fields: JSON.stringify([
          'name',
          'default_currency',
          'default_receivable_account',
          'default_cash_account',
          'default_bank_account',
        ]),
        limit_page_length: 50,
        order_by: 'modified desc',
      },
    }),
    http.get<FrappeListResponse<CollectionAccountOption>>('/resource/Account', {
      params: {
        fields: JSON.stringify(['name', 'company', 'account_type', 'account_currency', 'disabled', 'is_group']),
        filters: JSON.stringify([
          ['Account', 'account_type', 'in', ['Bank', 'Cash', 'Receivable']],
          ['Account', 'is_group', '=', 0],
          ['Account', 'disabled', '=', 0],
        ]),
        limit_page_length: 200,
        order_by: 'name asc',
      },
    }),
    http.get<FrappeListResponse<{ name: string }>>('/resource/Mode of Payment', {
      params: {
        fields: JSON.stringify(['name']),
        limit_page_length: 100,
        order_by: 'name asc',
      },
    }),
  ])

  const accounts = accountsResponse.data.data

  return {
    companies: companiesResponse.data.data,
    paymentAccounts: accounts.filter((account) => account.account_type === 'Bank' || account.account_type === 'Cash'),
    receivableAccounts: accounts.filter((account) => account.account_type === 'Receivable'),
    modesOfPayment: modesResponse.data.data.map((mode) => mode.name),
  }
}

export async function listOutstandingCustomerInvoices(customer: string, company?: string) {
  const filters: unknown[] = [
    ['Sales Invoice', 'docstatus', '=', 1],
    ['Sales Invoice', 'customer', '=', customer],
    ['Sales Invoice', 'outstanding_amount', '>', 0],
  ]

  if (company?.trim()) {
    filters.push(['Sales Invoice', 'company', '=', company.trim()])
  }

  const response = await http.get<FrappeListResponse<CollectionOutstandingInvoice>>('/resource/Sales Invoice', {
    params: {
      fields: JSON.stringify([
        'name',
        'customer',
        'company',
        'posting_date',
        'due_date',
        'currency',
        'grand_total',
        'outstanding_amount',
        'conversion_rate',
        'debit_to',
        'status',
      ]),
      filters: JSON.stringify(filters),
      limit_page_length: 50,
      order_by: 'posting_date desc',
    },
  })

  return response.data.data
}

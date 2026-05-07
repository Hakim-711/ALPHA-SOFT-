import { http } from '@/core/api/http'
import { getResourceCount } from '@/core/api/resource'
import type { FrappeDocResponse, FrappeListResponse } from '@/core/api/types'
import { formatDateInputValue } from '@/shared/utils/date'
import type {
  Disbursement,
  DisbursementAccountOption,
  DisbursementDefaults,
  DisbursementFormReference,
  DisbursementFormValues,
  DisbursementListResult,
  DisbursementOutstandingInvoice,
} from '../types/disbursement.types'

interface FrappeMethodResponse<T> {
  message: T
}

type ListDisbursementsParams = {
  limit?: number
  offset?: number
  search?: string
  lifecycle?: 'draft' | 'submitted' | 'cancelled' | 'all'
  company?: string
}

const DISBURSEMENT_FIELDS = [
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

function roundAmount(value: number) {
  return Math.round(value * 100) / 100
}

function calculateReceivedAmount(paidAmount: number, sourceExchangeRate: number, targetExchangeRate: number) {
  if (!paidAmount || !sourceExchangeRate || !targetExchangeRate) {
    return 0
  }

  return roundAmount((paidAmount * sourceExchangeRate) / targetExchangeRate)
}

function calculatePaidAmount(receivedAmount: number, sourceExchangeRate: number, targetExchangeRate: number) {
  if (!receivedAmount || !sourceExchangeRate || !targetExchangeRate) {
    return 0
  }

  return roundAmount((receivedAmount * targetExchangeRate) / sourceExchangeRate)
}

function buildFilters(params: ListDisbursementsParams) {
  const filters: unknown[] = [
    ['Payment Entry', 'payment_type', '=', 'Pay'],
    ['Payment Entry', 'party_type', '=', 'Supplier'],
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

function normalizeReferences(references: DisbursementFormReference[]) {
  return references
    .filter((reference) => reference.reference_name.trim() && reference.allocated_amount > 0)
    .map((reference) => ({
      doctype: 'Payment Entry Reference',
      reference_doctype: 'Purchase Invoice',
      reference_name: reference.reference_name.trim(),
      allocated_amount: reference.allocated_amount,
    }))
}

function toDisbursementPayload(payload: DisbursementFormValues) {
  return {
    payment_type: 'Pay',
    party_type: 'Supplier',
    company: payload.company.trim(),
    posting_date: payload.posting_date,
    party: payload.supplier.trim(),
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

export function disbursementToFormValues(disbursement?: Disbursement): DisbursementFormValues {
  return {
    company: disbursement?.company ?? '',
    posting_date: disbursement?.posting_date ?? formatDateInputValue(),
    supplier: disbursement?.party ?? '',
    paid_from: disbursement?.paid_from ?? '',
    paid_to: disbursement?.paid_to ?? '',
    paid_amount: disbursement?.paid_amount ?? 0,
    received_amount: disbursement?.received_amount ?? 0,
    source_exchange_rate: disbursement?.source_exchange_rate ?? 1,
    target_exchange_rate: disbursement?.target_exchange_rate ?? 1,
    mode_of_payment: disbursement?.mode_of_payment ?? '',
    reference_no: disbursement?.reference_no ?? '',
    reference_date: disbursement?.reference_date ?? '',
    remarks: disbursement?.remarks ?? '',
    references:
      disbursement?.references?.map((reference) => ({
        reference_name: reference.reference_name,
        due_date: reference.due_date ?? '',
        total_amount: reference.total_amount,
        outstanding_amount: reference.outstanding_amount,
        allocated_amount: reference.allocated_amount ?? 0,
      })) ?? [],
  }
}

export function createReferenceFromPurchaseInvoice(invoice: DisbursementOutstandingInvoice): DisbursementFormReference {
  return {
    reference_name: invoice.name,
    due_date: invoice.due_date ?? '',
    total_amount: invoice.grand_total,
    outstanding_amount: invoice.outstanding_amount,
    allocated_amount: invoice.outstanding_amount ?? 0,
    invoice_currency: invoice.currency,
    credit_to: invoice.credit_to,
  }
}

export async function listDisbursements(params: ListDisbursementsParams = {}): Promise<DisbursementListResult> {
  const { limit = 20, offset = 0 } = params
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const response = await http.get<FrappeListResponse<Disbursement>>('/resource/Payment Entry', {
    params: {
      fields: JSON.stringify(DISBURSEMENT_FIELDS),
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

export async function getDisbursementSummary(params: ListDisbursementsParams = {}) {
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

export async function getDisbursement(name: string) {
  const response = await http.get<FrappeDocResponse<Disbursement>>(`/resource/Payment Entry/${encodeURIComponent(name)}`)
  return response.data.data
}

export async function createDisbursement(payload: DisbursementFormValues) {
  const response = await http.post<FrappeDocResponse<Disbursement>>('/resource/Payment Entry', toDisbursementPayload(payload))
  return response.data.data
}

export async function updateDisbursement(name: string, payload: DisbursementFormValues) {
  const response = await http.put<FrappeDocResponse<Disbursement>>(
    `/resource/Payment Entry/${encodeURIComponent(name)}`,
    toDisbursementPayload(payload),
  )

  return response.data.data
}

export async function submitDisbursement(disbursement: Disbursement) {
  const response = await http.post<FrappeMethodResponse<Disbursement>>('/method/frappe.client.submit', {
    doc: JSON.stringify(disbursement),
  })

  return response.data.message
}

export async function cancelDisbursement(disbursement: Disbursement) {
  const response = await http.post<FrappeMethodResponse<Disbursement>>('/method/frappe.client.cancel', {
    doc: JSON.stringify(disbursement),
  })

  return response.data.message
}

export async function getDisbursementDefaults(): Promise<DisbursementDefaults> {
  const [companiesResponse, accountsResponse, modesResponse] = await Promise.all([
    http.get<
      FrappeListResponse<{
        name: string
        default_currency?: string
        default_cash_account?: string
        default_bank_account?: string
        default_payable_account?: string
      }>
    >('/resource/Company', {
      params: {
        fields: JSON.stringify([
          'name',
          'default_currency',
          'default_cash_account',
          'default_bank_account',
          'default_payable_account',
        ]),
        limit_page_length: 50,
        order_by: 'modified desc',
      },
    }),
    http.get<FrappeListResponse<DisbursementAccountOption>>('/resource/Account', {
      params: {
        fields: JSON.stringify(['name', 'company', 'account_type', 'account_currency', 'disabled', 'is_group']),
        filters: JSON.stringify([
          ['Account', 'account_type', 'in', ['Bank', 'Cash', 'Payable']],
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
    payableAccounts: accounts.filter((account) => account.account_type === 'Payable'),
    modesOfPayment: modesResponse.data.data.map((mode) => mode.name),
  }
}

export async function listOutstandingSupplierInvoices(supplier: string, company?: string) {
  const filters: unknown[] = [
    ['Purchase Invoice', 'docstatus', '=', 1],
    ['Purchase Invoice', 'supplier', '=', supplier],
    ['Purchase Invoice', 'outstanding_amount', '>', 0],
  ]

  if (company?.trim()) {
    filters.push(['Purchase Invoice', 'company', '=', company.trim()])
  }

  const response = await http.get<FrappeListResponse<DisbursementOutstandingInvoice>>('/resource/Purchase Invoice', {
    params: {
      fields: JSON.stringify([
        'name',
        'supplier',
        'company',
        'posting_date',
        'due_date',
        'currency',
        'grand_total',
        'outstanding_amount',
        'conversion_rate',
        'credit_to',
        'status',
      ]),
      filters: JSON.stringify(filters),
      limit_page_length: 50,
      order_by: 'posting_date desc',
    },
  })

  return response.data.data
}

export { calculatePaidAmount, calculateReceivedAmount, roundAmount }

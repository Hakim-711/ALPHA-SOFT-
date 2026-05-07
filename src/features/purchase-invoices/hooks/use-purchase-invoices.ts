import { useQuery } from '@tanstack/react-query'
import { getPurchaseInvoiceSummary, listPurchaseInvoices } from '../api/purchase-invoices.api'

interface UsePurchaseInvoicesOptions {
  search?: string
  limit?: number
  offset?: number
  lifecycle?: 'draft' | 'submitted' | 'cancelled' | 'all'
  company?: string
}

export const purchaseInvoiceQueryKeys = {
  all: ['purchase-invoices'] as const,
  list: (options: UsePurchaseInvoicesOptions) => [...purchaseInvoiceQueryKeys.all, 'list', options] as const,
  summary: (options: Omit<UsePurchaseInvoicesOptions, 'limit' | 'offset'>) =>
    [...purchaseInvoiceQueryKeys.all, 'summary', options] as const,
  detail: (name?: string) => [...purchaseInvoiceQueryKeys.all, 'detail', name] as const,
}

export function usePurchaseInvoices(options: UsePurchaseInvoicesOptions = {}) {
  const { search = '', limit = 20, offset = 0, lifecycle = 'all', company = 'all' } = options

  return useQuery({
    queryKey: purchaseInvoiceQueryKeys.list({ search, limit, offset, lifecycle, company }),
    queryFn: () => listPurchaseInvoices({ search, limit, offset, lifecycle, company }),
  })
}

export function usePurchaseInvoiceSummary(options: Omit<UsePurchaseInvoicesOptions, 'limit' | 'offset'> = {}) {
  const { search = '', lifecycle = 'all', company = 'all' } = options

  return useQuery({
    queryKey: purchaseInvoiceQueryKeys.summary({ search, lifecycle, company }),
    queryFn: () => getPurchaseInvoiceSummary({ search, lifecycle, company }),
  })
}

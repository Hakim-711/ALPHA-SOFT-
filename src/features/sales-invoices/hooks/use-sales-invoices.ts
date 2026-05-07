import { useQuery } from '@tanstack/react-query'
import { getSalesInvoiceSummary, listSalesInvoices } from '../api/sales-invoices.api'

interface UseSalesInvoicesOptions {
  search?: string
  limit?: number
  offset?: number
  lifecycle?: 'draft' | 'submitted' | 'cancelled' | 'all'
  company?: string
}

export const salesInvoiceQueryKeys = {
  all: ['sales-invoices'] as const,
  list: (options: UseSalesInvoicesOptions) => [...salesInvoiceQueryKeys.all, 'list', options] as const,
  summary: (options: Omit<UseSalesInvoicesOptions, 'limit' | 'offset'>) =>
    [...salesInvoiceQueryKeys.all, 'summary', options] as const,
  detail: (name?: string) => [...salesInvoiceQueryKeys.all, 'detail', name] as const,
}

export function useSalesInvoices(options: UseSalesInvoicesOptions = {}) {
  const { search = '', limit = 20, offset = 0, lifecycle = 'all', company = 'all' } = options

  return useQuery({
    queryKey: salesInvoiceQueryKeys.list({ search, limit, offset, lifecycle, company }),
    queryFn: () => listSalesInvoices({ search, limit, offset, lifecycle, company }),
  })
}

export function useSalesInvoiceSummary(options: Omit<UseSalesInvoicesOptions, 'limit' | 'offset'> = {}) {
  const { search = '', lifecycle = 'all', company = 'all' } = options

  return useQuery({
    queryKey: salesInvoiceQueryKeys.summary({ search, lifecycle, company }),
    queryFn: () => getSalesInvoiceSummary({ search, lifecycle, company }),
  })
}

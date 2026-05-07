import { useQuery } from '@tanstack/react-query'
import { getStockEntrySummary, listStockEntries } from '../api/stock.api'
import type { StockEntryPurpose } from '../types/stock.types'

interface UseStockEntriesOptions {
  search?: string
  limit?: number
  offset?: number
  lifecycle?: 'draft' | 'submitted' | 'cancelled' | 'all'
  company?: string
  purpose?: StockEntryPurpose | 'all'
}

export const stockQueryKeys = {
  all: ['stock'] as const,
  list: (options: UseStockEntriesOptions) => [...stockQueryKeys.all, 'list', options] as const,
  summary: (options: Omit<UseStockEntriesOptions, 'limit' | 'offset'>) => [...stockQueryKeys.all, 'summary', options] as const,
  detail: (name?: string) => [...stockQueryKeys.all, 'detail', name] as const,
  ledger: (voucherNo?: string) => [...stockQueryKeys.all, 'ledger', voucherNo ?? 'recent'] as const,
}

export function useStockEntries(options: UseStockEntriesOptions = {}) {
  const { search = '', limit = 20, offset = 0, lifecycle = 'all', company = 'all', purpose = 'all' } = options

  return useQuery({
    queryKey: stockQueryKeys.list({ search, limit, offset, lifecycle, company, purpose }),
    queryFn: () => listStockEntries({ search, limit, offset, lifecycle, company, purpose }),
  })
}

export function useStockEntrySummary(options: Omit<UseStockEntriesOptions, 'limit' | 'offset'> = {}) {
  const { search = '', lifecycle = 'all', company = 'all', purpose = 'all' } = options

  return useQuery({
    queryKey: stockQueryKeys.summary({ search, lifecycle, company, purpose }),
    queryFn: () => getStockEntrySummary({ search, lifecycle, company, purpose }),
  })
}

import { useQuery } from '@tanstack/react-query'
import { getStockReconciliationSummary, listStockReconciliations } from '../api/stock-reconciliations.api'
import type { StockReconciliationPurpose } from '../types/stock-reconciliation.types'

interface UseStockReconciliationsOptions {
  search?: string
  limit?: number
  offset?: number
  lifecycle?: 'draft' | 'submitted' | 'cancelled' | 'all'
  company?: string
  purpose?: StockReconciliationPurpose | 'all'
}

export const stockReconciliationQueryKeys = {
  all: ['stock-reconciliations'] as const,
  list: (options: UseStockReconciliationsOptions) => [...stockReconciliationQueryKeys.all, 'list', options] as const,
  summary: (options: Omit<UseStockReconciliationsOptions, 'limit' | 'offset'>) =>
    [...stockReconciliationQueryKeys.all, 'summary', options] as const,
  detail: (name?: string) => [...stockReconciliationQueryKeys.all, 'detail', name] as const,
}

export function useStockReconciliations(options: UseStockReconciliationsOptions = {}) {
  const { search = '', limit = 20, offset = 0, lifecycle = 'all', company = 'all', purpose = 'all' } = options

  return useQuery({
    queryKey: stockReconciliationQueryKeys.list({ search, limit, offset, lifecycle, company, purpose }),
    queryFn: () => listStockReconciliations({ search, limit, offset, lifecycle, company, purpose }),
  })
}

export function useStockReconciliationSummary(options: Omit<UseStockReconciliationsOptions, 'limit' | 'offset'> = {}) {
  const { search = '', lifecycle = 'all', company = 'all', purpose = 'all' } = options

  return useQuery({
    queryKey: stockReconciliationQueryKeys.summary({ search, lifecycle, company, purpose }),
    queryFn: () => getStockReconciliationSummary({ search, lifecycle, company, purpose }),
  })
}

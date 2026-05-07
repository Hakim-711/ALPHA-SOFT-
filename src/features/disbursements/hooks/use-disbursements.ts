import { useQuery } from '@tanstack/react-query'
import { getDisbursementSummary, listDisbursements } from '../api/disbursements.api'

interface UseDisbursementsOptions {
  search?: string
  lifecycle?: 'draft' | 'submitted' | 'cancelled' | 'all'
  company?: string
  limit?: number
  offset?: number
}

export const disbursementQueryKeys = {
  all: ['disbursements'] as const,
  lists: () => [...disbursementQueryKeys.all, 'list'] as const,
  list: (options: UseDisbursementsOptions) => [...disbursementQueryKeys.lists(), options] as const,
  summary: (options: Omit<UseDisbursementsOptions, 'limit' | 'offset'>) =>
    [...disbursementQueryKeys.all, 'summary', options] as const,
  details: () => [...disbursementQueryKeys.all, 'detail'] as const,
  detail: (name?: string) => [...disbursementQueryKeys.details(), name] as const,
  outstanding: (supplier?: string, company?: string) =>
    [...disbursementQueryKeys.all, 'outstanding', supplier, company] as const,
  defaults: () => [...disbursementQueryKeys.all, 'defaults'] as const,
}

export function useDisbursements(options: UseDisbursementsOptions = {}) {
  const { search = '', lifecycle = 'all', company = 'all', limit = 20, offset = 0 } = options

  return useQuery({
    queryKey: disbursementQueryKeys.list({ search, lifecycle, company, limit, offset }),
    queryFn: () => listDisbursements({ search, lifecycle, company, limit, offset }),
  })
}

export function useDisbursementSummary(options: Omit<UseDisbursementsOptions, 'limit' | 'offset'> = {}) {
  const { search = '', lifecycle = 'all', company = 'all' } = options

  return useQuery({
    queryKey: disbursementQueryKeys.summary({ search, lifecycle, company }),
    queryFn: () => getDisbursementSummary({ search, lifecycle, company }),
  })
}

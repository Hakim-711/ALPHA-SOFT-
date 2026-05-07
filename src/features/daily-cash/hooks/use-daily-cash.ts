import { useQuery } from '@tanstack/react-query'
import { getDailyCashDefaults, getDailyCashReport } from '../api/daily-cash.api'
import type { DailyCashFilters } from '../types/daily-cash.types'

export const dailyCashQueryKeys = {
  all: ['daily-cash'] as const,
  defaults: () => [...dailyCashQueryKeys.all, 'defaults'] as const,
  report: (filters: DailyCashFilters) => [...dailyCashQueryKeys.all, 'report', filters] as const,
}

export function useDailyCashDefaults() {
  return useQuery({
    queryKey: dailyCashQueryKeys.defaults(),
    queryFn: getDailyCashDefaults,
    staleTime: 60_000,
  })
}

export function useDailyCashReport(filters: DailyCashFilters, enabled = true) {
  return useQuery({
    queryKey: dailyCashQueryKeys.report(filters),
    queryFn: () => getDailyCashReport(filters),
    enabled,
    staleTime: 30_000,
  })
}

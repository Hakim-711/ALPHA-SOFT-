import { useQuery } from '@tanstack/react-query'
import { getDashboardSummary } from '../api/dashboard.api'

export const dashboardQueryKeys = {
  summary: ['dashboard', 'summary'] as const,
}

export function useDashboard() {
  return useQuery({
    queryKey: dashboardQueryKeys.summary,
    queryFn: getDashboardSummary,
    staleTime: 30_000,
    retry: 0,
  })
}

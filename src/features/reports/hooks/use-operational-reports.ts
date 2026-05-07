import { useQuery } from '@tanstack/react-query'
import { getOperationalReports } from '../api/reports.api'

export function useOperationalReports() {
  return useQuery({
    queryKey: ['reports', 'operational'],
    queryFn: getOperationalReports,
    staleTime: 45_000,
  })
}

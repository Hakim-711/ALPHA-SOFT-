import { useQuery } from '@tanstack/react-query'
import { searchGlobalRecords, type GlobalSearchPermissions } from '../api/global-search.api'

export function useGlobalSearch(term: string, permissions: GlobalSearchPermissions) {
  const normalizedTerm = term.trim()

  return useQuery({
    queryKey: ['global-search', normalizedTerm, permissions],
    queryFn: () => searchGlobalRecords(normalizedTerm, permissions),
    enabled: normalizedTerm.length >= 2,
    staleTime: 15_000,
  })
}

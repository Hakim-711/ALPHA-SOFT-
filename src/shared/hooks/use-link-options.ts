import { useQuery } from '@tanstack/react-query'
import { listResourceNames } from '@/core/api/resource'

export function useLinkOptions(doctype: string, search = '') {
  return useQuery({
    queryKey: ['link-options', doctype, search],
    queryFn: () => listResourceNames(doctype, { search }),
    staleTime: 60_000,
  })
}

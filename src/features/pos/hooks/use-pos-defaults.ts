import { useQuery } from '@tanstack/react-query'
import { getPosDefaults, getPosProfile } from '../api/pos.api'

export const posQueryKeys = {
  all: ['pos'] as const,
  defaults: () => [...posQueryKeys.all, 'defaults'] as const,
  profile: (name?: string) => [...posQueryKeys.all, 'profile', name] as const,
  search: (term: string, priceList?: string, warehouse?: string, itemGroup?: string, brand?: string) =>
    [...posQueryKeys.all, 'item-search', term, priceList, warehouse, itemGroup, brand] as const,
}

export function usePosDefaults() {
  return useQuery({
    queryKey: posQueryKeys.defaults(),
    queryFn: getPosDefaults,
    staleTime: 60_000,
  })
}

export function usePosProfile(name?: string) {
  return useQuery({
    queryKey: posQueryKeys.profile(name),
    queryFn: () => getPosProfile(name as string),
    enabled: Boolean(name),
    staleTime: 60_000,
  })
}

import { useQuery } from '@tanstack/react-query'
import { searchPosItems } from '../api/pos.api'
import { posQueryKeys } from './use-pos-defaults'

export function usePosItemSearch(term: string, priceList?: string, warehouse?: string, itemGroup?: string, brand?: string) {
  const trimmed = term.trim()

  return useQuery({
    queryKey: posQueryKeys.search(trimmed, priceList, warehouse, itemGroup, brand),
    queryFn: () => searchPosItems(trimmed, priceList, warehouse, { itemGroup, brand }),
    enabled: Boolean(priceList),
    staleTime: 20_000,
  })
}

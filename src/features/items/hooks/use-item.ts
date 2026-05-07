import { useQuery } from '@tanstack/react-query'
import { getItem } from '../api/items.api'
import { itemQueryKeys } from './use-items'

export function useItem(name?: string) {
  return useQuery({
    queryKey: itemQueryKeys.detail(name),
    queryFn: () => getItem(name as string),
    enabled: Boolean(name),
  })
}

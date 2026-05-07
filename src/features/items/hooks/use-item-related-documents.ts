import { useQuery } from '@tanstack/react-query'
import { listItemRelatedDocuments } from '../api/items.api'
import { itemQueryKeys } from './use-items'

export function useItemRelatedDocuments(itemCode?: string) {
  return useQuery({
    queryKey: itemQueryKeys.related(itemCode),
    queryFn: () => listItemRelatedDocuments(itemCode as string),
    enabled: Boolean(itemCode),
    retry: 0,
  })
}

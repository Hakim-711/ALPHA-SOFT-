import { useQuery } from '@tanstack/react-query'
import { getCollection } from '../api/collections.api'
import { collectionQueryKeys } from './use-collections'

export function useCollection(name?: string) {
  return useQuery({
    queryKey: collectionQueryKeys.detail(name),
    queryFn: () => getCollection(name as string),
    enabled: Boolean(name),
  })
}

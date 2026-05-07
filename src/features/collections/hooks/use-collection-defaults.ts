import { useQuery } from '@tanstack/react-query'
import { getCollectionDefaults } from '../api/collections.api'
import { collectionQueryKeys } from './use-collections'

export function useCollectionDefaults() {
  return useQuery({
    queryKey: collectionQueryKeys.defaults(),
    queryFn: getCollectionDefaults,
    staleTime: 60_000,
  })
}

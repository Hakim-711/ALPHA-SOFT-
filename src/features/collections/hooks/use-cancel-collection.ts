import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelCollection } from '../api/collections.api'
import type { Collection } from '../types/collection.types'
import { collectionQueryKeys } from './use-collections'

export function useCancelCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (collection: Collection) => cancelCollection(collection),
    onSuccess: async (collection) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: collectionQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: collectionQueryKeys.detail(collection.name) }),
      ])
    },
  })
}

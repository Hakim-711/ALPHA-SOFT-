import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitCollection } from '../api/collections.api'
import type { Collection } from '../types/collection.types'
import { collectionQueryKeys } from './use-collections'

export function useSubmitCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (collection: Collection) => submitCollection(collection),
    onSuccess: async (collection) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: collectionQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: collectionQueryKeys.detail(collection.name) }),
      ])
    },
  })
}

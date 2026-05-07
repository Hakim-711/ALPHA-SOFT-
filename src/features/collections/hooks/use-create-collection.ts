import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCollection } from '../api/collections.api'
import type { CollectionFormValues } from '../types/collection.types'
import { collectionQueryKeys } from './use-collections'

export function useCreateCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CollectionFormValues) => createCollection(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: collectionQueryKeys.all })
    },
  })
}

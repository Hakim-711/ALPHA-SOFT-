import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCollection } from '../api/collections.api'
import type { CollectionFormValues } from '../types/collection.types'
import { collectionQueryKeys } from './use-collections'

interface UpdateCollectionPayload {
  name: string
  values: CollectionFormValues
}

export function useUpdateCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, values }: UpdateCollectionPayload) => updateCollection(name, values),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: collectionQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: collectionQueryKeys.detail(variables.name) }),
      ])
    },
  })
}

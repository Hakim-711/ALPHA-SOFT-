import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateItem } from '../api/items.api'
import type { ItemFormValues } from '../types/item.types'
import { itemQueryKeys } from './use-items'

interface UpdatePayload {
  name: string
  values: ItemFormValues
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, values }: UpdatePayload) => updateItem(name, values),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: itemQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: itemQueryKeys.detail(variables.name) }),
      ])
    },
  })
}

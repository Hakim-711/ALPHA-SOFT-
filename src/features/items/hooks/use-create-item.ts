import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createItem } from '../api/items.api'
import type { ItemFormValues } from '../types/item.types'
import { itemQueryKeys } from './use-items'

export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ItemFormValues) => createItem(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: itemQueryKeys.all })
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setItemDisabled } from '../api/items.api'
import { itemQueryKeys } from './use-items'

interface SetDisabledPayload {
  name: string
  disabled: boolean
}

export function useSetItemDisabled() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, disabled }: SetDisabledPayload) => setItemDisabled(name, disabled),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: itemQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: itemQueryKeys.detail(variables.name) }),
      ])
    },
  })
}

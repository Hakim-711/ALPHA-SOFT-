import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setCustomerDisabled } from '../api/customers.api'
import { customerQueryKeys } from './use-customers'

interface SetDisabledPayload {
  name: string
  disabled: boolean
}

export function useSetCustomerDisabled() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, disabled }: SetDisabledPayload) => setCustomerDisabled(name, disabled),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customerQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: customerQueryKeys.detail(variables.name) }),
      ])
    },
  })
}


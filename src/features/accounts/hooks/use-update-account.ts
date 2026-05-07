import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateAccount } from '../api/accounts.api'
import type { AccountFormValues } from '../types/account.types'

interface UpdatePayload {
  name: string
  values: AccountFormValues
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, values }: UpdatePayload) => updateAccount(name, values),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['accounts-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['account', variables.name] }),
      ])
    },
  })
}

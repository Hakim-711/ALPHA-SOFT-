import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAccount } from '../api/accounts.api'
import type { AccountFormValues } from '../types/account.types'

export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AccountFormValues) => createAccount(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['accounts-summary'] }),
      ])
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setSupplierDisabled } from '../api/suppliers.api'
import { supplierQueryKeys } from './use-suppliers'

interface SetDisabledPayload {
  name: string
  disabled: boolean
}

export function useSetSupplierDisabled() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, disabled }: SetDisabledPayload) => setSupplierDisabled(name, disabled),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: supplierQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: supplierQueryKeys.detail(variables.name) }),
      ])
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateSupplier } from '../api/suppliers.api'
import type { SupplierFormValues } from '../types/supplier.types'
import { supplierQueryKeys } from './use-suppliers'

interface UpdatePayload {
  name: string
  values: SupplierFormValues
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, values }: UpdatePayload) => updateSupplier(name, values),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: supplierQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: supplierQueryKeys.detail(variables.name) }),
      ])
    },
  })
}

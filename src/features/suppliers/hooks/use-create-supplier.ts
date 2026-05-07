import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createSupplier } from '../api/suppliers.api'
import type { SupplierFormValues } from '../types/supplier.types'
import { supplierQueryKeys } from './use-suppliers'

export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SupplierFormValues) => createSupplier(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: supplierQueryKeys.all })
    },
  })
}

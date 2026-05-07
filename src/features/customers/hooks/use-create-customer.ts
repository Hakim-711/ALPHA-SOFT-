import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCustomer } from '../api/customers.api'
import type { CustomerFormValues } from '../types/customer.types'
import { customerQueryKeys } from './use-customers'

export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CustomerFormValues) => createCustomer(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customerQueryKeys.all })
    },
  })
}


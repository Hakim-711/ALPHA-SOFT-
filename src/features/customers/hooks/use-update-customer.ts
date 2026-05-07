import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCustomer } from '../api/customers.api'
import type { CustomerFormValues } from '../types/customer.types'
import { customerQueryKeys } from './use-customers'

interface UpdatePayload {
  name: string
  values: CustomerFormValues
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, values }: UpdatePayload) => updateCustomer(name, values),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customerQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: customerQueryKeys.detail(variables.name) }),
      ])
    },
  })
}


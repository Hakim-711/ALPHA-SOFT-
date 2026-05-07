import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateSalesOrder } from '../api/sales-orders.api'
import type { SalesOrderFormValues } from '../types/sales-order.types'
import { salesOrderQueryKeys } from './use-sales-orders'

interface UpdatePayload {
  name: string
  values: SalesOrderFormValues
}

export function useUpdateSalesOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, values }: UpdatePayload) => updateSalesOrder(name, values),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: salesOrderQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: salesOrderQueryKeys.detail(variables.name) }),
      ])
    },
  })
}

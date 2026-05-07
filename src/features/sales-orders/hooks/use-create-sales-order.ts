import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createSalesOrder } from '../api/sales-orders.api'
import type { SalesOrderFormValues } from '../types/sales-order.types'
import { salesOrderQueryKeys } from './use-sales-orders'

export function useCreateSalesOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SalesOrderFormValues) => createSalesOrder(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: salesOrderQueryKeys.all })
    },
  })
}

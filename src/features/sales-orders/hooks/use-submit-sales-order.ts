import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitSalesOrder } from '../api/sales-orders.api'
import type { SalesOrder } from '../types/sales-order.types'
import { salesOrderQueryKeys } from './use-sales-orders'

export function useSubmitSalesOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (order: SalesOrder) => submitSalesOrder(order),
    onSuccess: async (order) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: salesOrderQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: salesOrderQueryKeys.detail(order.name) }),
      ])
    },
  })
}

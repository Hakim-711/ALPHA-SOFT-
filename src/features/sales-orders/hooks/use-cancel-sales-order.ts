import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelSalesOrder } from '../api/sales-orders.api'
import type { SalesOrder } from '../types/sales-order.types'
import { salesOrderQueryKeys } from './use-sales-orders'

export function useCancelSalesOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (order: SalesOrder) => cancelSalesOrder(order),
    onSuccess: async (order) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: salesOrderQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: salesOrderQueryKeys.detail(order.name) }),
      ])
    },
  })
}

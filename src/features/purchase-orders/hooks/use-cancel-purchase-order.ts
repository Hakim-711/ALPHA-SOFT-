import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelPurchaseOrder } from '../api/purchase-orders.api'
import type { PurchaseOrder } from '../types/purchase-order.types'
import { purchaseOrderQueryKeys } from './use-purchase-orders'

export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (order: PurchaseOrder) => cancelPurchaseOrder(order),
    onSuccess: async (order) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: purchaseOrderQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: purchaseOrderQueryKeys.detail(order.name) }),
      ])
    },
  })
}



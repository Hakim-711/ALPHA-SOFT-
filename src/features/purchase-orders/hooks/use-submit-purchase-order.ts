import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitPurchaseOrder } from '../api/purchase-orders.api'
import type { PurchaseOrder } from '../types/purchase-order.types'
import { purchaseOrderQueryKeys } from './use-purchase-orders'

export function useSubmitPurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (order: PurchaseOrder) => submitPurchaseOrder(order),
    onSuccess: async (order) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: purchaseOrderQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: purchaseOrderQueryKeys.detail(order.name) }),
      ])
    },
  })
}



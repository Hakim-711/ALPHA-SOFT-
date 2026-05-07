import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPurchaseOrder } from '../api/purchase-orders.api'
import type { PurchaseOrderFormValues } from '../types/purchase-order.types'
import { purchaseOrderQueryKeys } from './use-purchase-orders'

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PurchaseOrderFormValues) => createPurchaseOrder(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: purchaseOrderQueryKeys.all })
    },
  })
}



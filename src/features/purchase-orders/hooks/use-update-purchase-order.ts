import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updatePurchaseOrder } from '../api/purchase-orders.api'
import type { PurchaseOrderFormValues } from '../types/purchase-order.types'
import { purchaseOrderQueryKeys } from './use-purchase-orders'

interface UpdatePayload {
  name: string
  values: PurchaseOrderFormValues
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, values }: UpdatePayload) => updatePurchaseOrder(name, values),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: purchaseOrderQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: purchaseOrderQueryKeys.detail(variables.name) }),
      ])
    },
  })
}



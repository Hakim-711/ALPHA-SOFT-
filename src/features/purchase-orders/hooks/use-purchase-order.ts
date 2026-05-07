import { useQuery } from '@tanstack/react-query'
import { getPurchaseOrder } from '../api/purchase-orders.api'
import { purchaseOrderQueryKeys } from './use-purchase-orders'

export function usePurchaseOrder(name?: string) {
  return useQuery({
    queryKey: purchaseOrderQueryKeys.detail(name),
    queryFn: () => getPurchaseOrder(name as string),
    enabled: Boolean(name),
  })
}



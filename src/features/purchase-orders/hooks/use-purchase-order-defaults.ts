import { useQuery } from '@tanstack/react-query'
import { getDefaultPurchaseOrderContext } from '../api/purchase-orders.api'

export function usePurchaseOrderDefaults() {
  return useQuery({
    queryKey: ['purchase-order-default-context'],
    queryFn: getDefaultPurchaseOrderContext,
    staleTime: 60_000,
    retry: 0,
  })
}



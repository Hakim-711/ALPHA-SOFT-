import { useQuery } from '@tanstack/react-query'
import { getSalesOrder } from '../api/sales-orders.api'
import { salesOrderQueryKeys } from './use-sales-orders'

export function useSalesOrder(name?: string) {
  return useQuery({
    queryKey: salesOrderQueryKeys.detail(name),
    queryFn: () => getSalesOrder(name as string),
    enabled: Boolean(name),
  })
}

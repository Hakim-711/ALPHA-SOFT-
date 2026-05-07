import { useQuery } from '@tanstack/react-query'
import { getDefaultSalesOrderContext } from '../api/sales-orders.api'

export function useSalesOrderDefaults() {
  return useQuery({
    queryKey: ['sales-order-default-context'],
    queryFn: getDefaultSalesOrderContext,
    staleTime: 60_000,
    retry: 0,
  })
}

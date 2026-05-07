import { useQuery } from '@tanstack/react-query'
import { getStockReconciliation } from '../api/stock-reconciliations.api'
import { stockReconciliationQueryKeys } from './use-stock-reconciliations'

export function useStockReconciliation(name?: string) {
  return useQuery({
    queryKey: stockReconciliationQueryKeys.detail(name),
    queryFn: () => getStockReconciliation(name as string),
    enabled: Boolean(name),
  })
}

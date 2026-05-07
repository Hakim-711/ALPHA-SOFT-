import { useQuery } from '@tanstack/react-query'
import { getDefaultStockReconciliationContext } from '../api/stock-reconciliations.api'

export function useStockReconciliationDefaults() {
  return useQuery({
    queryKey: ['stock-reconciliations', 'defaults'],
    queryFn: getDefaultStockReconciliationContext,
    staleTime: 60_000,
  })
}

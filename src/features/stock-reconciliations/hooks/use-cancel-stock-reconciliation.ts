import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelStockReconciliation } from '../api/stock-reconciliations.api'
import type { StockReconciliation } from '../types/stock-reconciliation.types'
import { stockReconciliationQueryKeys } from './use-stock-reconciliations'

export function useCancelStockReconciliation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (document: StockReconciliation) => cancelStockReconciliation(document),
    onSuccess: async (document) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: stockReconciliationQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: stockReconciliationQueryKeys.detail(document.name) }),
      ])
    },
  })
}

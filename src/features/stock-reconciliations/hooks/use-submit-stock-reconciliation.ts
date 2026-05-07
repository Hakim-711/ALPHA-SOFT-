import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitStockReconciliation } from '../api/stock-reconciliations.api'
import type { StockReconciliation } from '../types/stock-reconciliation.types'
import { stockReconciliationQueryKeys } from './use-stock-reconciliations'

export function useSubmitStockReconciliation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (document: StockReconciliation) => submitStockReconciliation(document),
    onSuccess: async (document) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: stockReconciliationQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: stockReconciliationQueryKeys.detail(document.name) }),
      ])
    },
  })
}

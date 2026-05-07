import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createStockReconciliation } from '../api/stock-reconciliations.api'
import type { StockReconciliationFormValues } from '../types/stock-reconciliation.types'
import { stockReconciliationQueryKeys } from './use-stock-reconciliations'

export function useCreateStockReconciliation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: StockReconciliationFormValues) => createStockReconciliation(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: stockReconciliationQueryKeys.all })
    },
  })
}

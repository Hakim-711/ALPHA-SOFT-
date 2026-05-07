import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateStockReconciliation } from '../api/stock-reconciliations.api'
import type { StockReconciliationFormValues } from '../types/stock-reconciliation.types'
import { stockReconciliationQueryKeys } from './use-stock-reconciliations'

interface UpdateStockReconciliationPayload {
  name: string
  values: StockReconciliationFormValues
}

export function useUpdateStockReconciliation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, values }: UpdateStockReconciliationPayload) => updateStockReconciliation(name, values),
    onSuccess: async (document) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: stockReconciliationQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: stockReconciliationQueryKeys.detail(document.name) }),
      ])
    },
  })
}

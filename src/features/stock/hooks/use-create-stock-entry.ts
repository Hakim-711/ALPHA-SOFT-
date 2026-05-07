import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createStockEntry } from '../api/stock.api'
import type { StockEntryFormValues } from '../types/stock.types'
import { stockQueryKeys } from './use-stock-entries'

export function useCreateStockEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: StockEntryFormValues) => createStockEntry(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: stockQueryKeys.all })
    },
  })
}

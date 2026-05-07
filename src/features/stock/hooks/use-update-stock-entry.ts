import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateStockEntry } from '../api/stock.api'
import type { StockEntryFormValues } from '../types/stock.types'
import { stockQueryKeys } from './use-stock-entries'

interface UpdateStockEntryPayload {
  name: string
  values: StockEntryFormValues
}

export function useUpdateStockEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, values }: UpdateStockEntryPayload) => updateStockEntry(name, values),
    onSuccess: async (entry) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: stockQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: stockQueryKeys.detail(entry.name) }),
      ])
    },
  })
}

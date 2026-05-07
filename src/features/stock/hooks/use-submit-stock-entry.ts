import { useMutation, useQueryClient } from '@tanstack/react-query'
import { submitStockEntry } from '../api/stock.api'
import type { StockEntry } from '../types/stock.types'
import { stockQueryKeys } from './use-stock-entries'

export function useSubmitStockEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (entry: StockEntry) => submitStockEntry(entry),
    onSuccess: async (entry) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: stockQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: stockQueryKeys.detail(entry.name) }),
        queryClient.invalidateQueries({ queryKey: stockQueryKeys.ledger(entry.name) }),
      ])
    },
  })
}

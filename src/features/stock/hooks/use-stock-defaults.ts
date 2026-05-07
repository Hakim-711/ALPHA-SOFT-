import { useQuery } from '@tanstack/react-query'
import { getDefaultStockEntryContext } from '../api/stock.api'

export function useStockDefaults() {
  return useQuery({
    queryKey: ['stock', 'defaults'],
    queryFn: getDefaultStockEntryContext,
    staleTime: 60_000,
  })
}

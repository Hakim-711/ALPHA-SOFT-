import { useQuery } from '@tanstack/react-query'
import { getStockEntry } from '../api/stock.api'
import { stockQueryKeys } from './use-stock-entries'

export function useStockEntry(name?: string) {
  return useQuery({
    queryKey: stockQueryKeys.detail(name),
    queryFn: () => getStockEntry(name as string),
    enabled: Boolean(name),
  })
}

import { useQuery } from '@tanstack/react-query'
import { listStockEntryLedger } from '../api/stock.api'
import { stockQueryKeys } from './use-stock-entries'

export function useStockEntryLedger(voucherNo?: string) {
  return useQuery({
    queryKey: stockQueryKeys.ledger(voucherNo),
    queryFn: () => listStockEntryLedger(voucherNo),
  })
}

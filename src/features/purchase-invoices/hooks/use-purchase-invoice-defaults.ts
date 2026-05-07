import { useQuery } from '@tanstack/react-query'
import { getDefaultPurchaseInvoiceContext } from '../api/purchase-invoices.api'

export function usePurchaseInvoiceDefaults() {
  return useQuery({
    queryKey: ['purchase-invoices', 'defaults'],
    queryFn: getDefaultPurchaseInvoiceContext,
    staleTime: 60_000,
  })
}

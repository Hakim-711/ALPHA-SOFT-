import { useQuery } from '@tanstack/react-query'
import { getPurchaseInvoice } from '../api/purchase-invoices.api'
import { purchaseInvoiceQueryKeys } from './use-purchase-invoices'

export function usePurchaseInvoice(name?: string) {
  return useQuery({
    queryKey: purchaseInvoiceQueryKeys.detail(name),
    queryFn: () => getPurchaseInvoice(name as string),
    enabled: Boolean(name),
  })
}

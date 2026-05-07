import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelPurchaseInvoice } from '../api/purchase-invoices.api'
import type { PurchaseInvoice } from '../types/purchase-invoice.types'
import { purchaseInvoiceQueryKeys } from './use-purchase-invoices'

export function useCancelPurchaseInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invoice: PurchaseInvoice) => cancelPurchaseInvoice(invoice),
    onSuccess: async (invoice) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: purchaseInvoiceQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: purchaseInvoiceQueryKeys.detail(invoice.name) }),
      ])
    },
  })
}

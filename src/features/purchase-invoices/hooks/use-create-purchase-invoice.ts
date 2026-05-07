import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPurchaseInvoice } from '../api/purchase-invoices.api'
import type { PurchaseInvoiceFormValues } from '../types/purchase-invoice.types'
import { purchaseInvoiceQueryKeys } from './use-purchase-invoices'

export function useCreatePurchaseInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PurchaseInvoiceFormValues) => createPurchaseInvoice(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: purchaseInvoiceQueryKeys.all })
    },
  })
}

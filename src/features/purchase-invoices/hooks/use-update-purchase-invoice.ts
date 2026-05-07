import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updatePurchaseInvoice } from '../api/purchase-invoices.api'
import type { PurchaseInvoiceFormValues } from '../types/purchase-invoice.types'
import { purchaseInvoiceQueryKeys } from './use-purchase-invoices'

interface UpdatePurchaseInvoicePayload {
  name: string
  values: PurchaseInvoiceFormValues
}

export function useUpdatePurchaseInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, values }: UpdatePurchaseInvoicePayload) => updatePurchaseInvoice(name, values),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: purchaseInvoiceQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: purchaseInvoiceQueryKeys.detail(variables.name) }),
      ])
    },
  })
}

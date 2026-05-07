import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createSalesInvoice } from '../api/sales-invoices.api'
import type { SalesInvoiceFormValues } from '../types/sales-invoice.types'
import { salesInvoiceQueryKeys } from './use-sales-invoices'

export function useCreateSalesInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SalesInvoiceFormValues) => createSalesInvoice(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: salesInvoiceQueryKeys.all })
    },
  })
}

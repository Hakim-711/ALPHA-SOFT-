import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelSalesInvoice } from '../api/sales-invoices.api'
import type { SalesInvoice } from '../types/sales-invoice.types'
import { salesInvoiceQueryKeys } from './use-sales-invoices'

export function useCancelSalesInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invoice: SalesInvoice) => cancelSalesInvoice(invoice),
    onSuccess: async (invoice) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: salesInvoiceQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: salesInvoiceQueryKeys.detail(invoice.name) }),
      ])
    },
  })
}

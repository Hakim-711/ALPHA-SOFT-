import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateSalesInvoice } from '../api/sales-invoices.api'
import type { SalesInvoiceFormValues } from '../types/sales-invoice.types'
import { salesInvoiceQueryKeys } from './use-sales-invoices'

interface UpdatePayload {
  name: string
  values: SalesInvoiceFormValues
}

export function useUpdateSalesInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, values }: UpdatePayload) => updateSalesInvoice(name, values),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: salesInvoiceQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: salesInvoiceQueryKeys.detail(variables.name) }),
      ])
    },
  })
}

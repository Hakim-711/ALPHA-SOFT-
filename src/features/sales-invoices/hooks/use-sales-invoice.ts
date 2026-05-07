import { useQuery } from '@tanstack/react-query'
import { getSalesInvoice } from '../api/sales-invoices.api'
import { salesInvoiceQueryKeys } from './use-sales-invoices'

export function useSalesInvoice(name?: string) {
  return useQuery({
    queryKey: salesInvoiceQueryKeys.detail(name),
    queryFn: () => getSalesInvoice(name as string),
    enabled: Boolean(name),
  })
}

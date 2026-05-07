import { useQuery } from '@tanstack/react-query'
import { getDefaultSalesInvoiceContext } from '../api/sales-invoices.api'

export function useSalesInvoiceDefaults() {
  return useQuery({
    queryKey: ['sales-invoice-defaults'],
    queryFn: getDefaultSalesInvoiceContext,
    staleTime: 60_000,
  })
}

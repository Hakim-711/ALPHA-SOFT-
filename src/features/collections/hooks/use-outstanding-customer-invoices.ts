import { useQuery } from '@tanstack/react-query'
import { listOutstandingCustomerInvoices } from '../api/collections.api'
import { collectionQueryKeys } from './use-collections'

interface UseOutstandingCustomerInvoicesOptions {
  customer?: string
  company?: string
}

export function useOutstandingCustomerInvoices(options: UseOutstandingCustomerInvoicesOptions = {}) {
  const customer = options.customer?.trim()
  const company = options.company?.trim()

  return useQuery({
    queryKey: collectionQueryKeys.outstanding(customer, company),
    queryFn: () => listOutstandingCustomerInvoices(customer as string, company),
    enabled: Boolean(customer),
    staleTime: 30_000,
  })
}

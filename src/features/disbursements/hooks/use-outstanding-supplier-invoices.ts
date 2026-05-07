import { useQuery } from '@tanstack/react-query'
import { listOutstandingSupplierInvoices } from '../api/disbursements.api'
import { disbursementQueryKeys } from './use-disbursements'

interface UseOutstandingSupplierInvoicesOptions {
  supplier?: string
  company?: string
}

export function useOutstandingSupplierInvoices(options: UseOutstandingSupplierInvoicesOptions = {}) {
  const supplier = options.supplier?.trim()
  const company = options.company?.trim()

  return useQuery({
    queryKey: disbursementQueryKeys.outstanding(supplier, company),
    queryFn: () => listOutstandingSupplierInvoices(supplier as string, company),
    enabled: Boolean(supplier),
    staleTime: 30_000,
  })
}

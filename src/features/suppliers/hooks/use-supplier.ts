import { useQuery } from '@tanstack/react-query'
import { getSupplier } from '../api/suppliers.api'
import { supplierQueryKeys } from './use-suppliers'

export function useSupplier(name?: string) {
  return useQuery({
    queryKey: supplierQueryKeys.detail(name),
    queryFn: () => getSupplier(name as string),
    enabled: Boolean(name),
  })
}

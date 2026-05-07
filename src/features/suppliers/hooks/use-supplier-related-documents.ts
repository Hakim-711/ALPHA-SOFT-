import { useQuery } from '@tanstack/react-query'
import { listSupplierRelatedDocuments } from '../api/suppliers.api'
import { supplierQueryKeys } from './use-suppliers'

export function useSupplierRelatedDocuments(name?: string) {
  return useQuery({
    queryKey: supplierQueryKeys.related(name),
    queryFn: () => listSupplierRelatedDocuments(name as string),
    enabled: Boolean(name),
    retry: 0,
  })
}

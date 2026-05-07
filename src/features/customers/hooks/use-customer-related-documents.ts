import { useQuery } from '@tanstack/react-query'
import { listCustomerRelatedDocuments } from '../api/customers.api'
import { customerQueryKeys } from './use-customers'

export function useCustomerRelatedDocuments(name?: string) {
  return useQuery({
    queryKey: customerQueryKeys.related(name),
    queryFn: () => listCustomerRelatedDocuments(name as string),
    enabled: Boolean(name),
    retry: 0,
  })
}


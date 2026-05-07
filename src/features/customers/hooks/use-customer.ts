import { useQuery } from '@tanstack/react-query'
import { getCustomer } from '../api/customers.api'
import { customerQueryKeys } from './use-customers'

export function useCustomer(name?: string) {
  return useQuery({
    queryKey: customerQueryKeys.detail(name),
    queryFn: () => getCustomer(name as string),
    enabled: Boolean(name),
  })
}


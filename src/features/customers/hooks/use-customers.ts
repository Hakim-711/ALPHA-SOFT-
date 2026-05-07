import { useQuery } from '@tanstack/react-query'
import { getCustomerSummary, listCustomers } from '../api/customers.api'

interface UseCustomersOptions {
  search?: string
  limit?: number
  offset?: number
  customerType?: string
  status?: 'active' | 'disabled' | 'all'
}

export const customerQueryKeys = {
  all: ['customers'] as const,
  list: (options: UseCustomersOptions) => [...customerQueryKeys.all, 'list', options] as const,
  summary: (options: UseCustomersOptions) => [...customerQueryKeys.all, 'summary', options] as const,
  detail: (name?: string) => ['customer', name] as const,
  related: (name?: string) => ['customer-related-documents', name] as const,
}

export function useCustomers(options: UseCustomersOptions = {}) {
  const { search = '', limit = 20, offset = 0, customerType = 'all', status = 'all' } = options

  return useQuery({
    queryKey: customerQueryKeys.list({ search, limit, offset, customerType, status }),
    queryFn: () => listCustomers({ search, limit, offset, customerType, status }),
  })
}

export function useCustomerSummary(options: Omit<UseCustomersOptions, 'limit' | 'offset'> = {}) {
  const { search = '', customerType = 'all', status = 'all' } = options

  return useQuery({
    queryKey: customerQueryKeys.summary({ search, customerType, status }),
    queryFn: () => getCustomerSummary({ search, customerType, status }),
  })
}

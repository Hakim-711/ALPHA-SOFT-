import { useQuery } from '@tanstack/react-query'
import { getSalesOrderSummary, listSalesOrders } from '../api/sales-orders.api'

interface UseSalesOrdersOptions {
  search?: string
  limit?: number
  offset?: number
  lifecycle?: 'draft' | 'submitted' | 'cancelled' | 'all'
  company?: string
}

export const salesOrderQueryKeys = {
  all: ['sales-orders'] as const,
  list: (options: UseSalesOrdersOptions) => [...salesOrderQueryKeys.all, 'list', options] as const,
  summary: (options: Omit<UseSalesOrdersOptions, 'limit' | 'offset'>) =>
    [...salesOrderQueryKeys.all, 'summary', options] as const,
  detail: (name?: string) => [...salesOrderQueryKeys.all, 'detail', name] as const,
}

export function useSalesOrders(options: UseSalesOrdersOptions = {}) {
  const { search = '', limit = 20, offset = 0, lifecycle = 'all', company = 'all' } = options

  return useQuery({
    queryKey: salesOrderQueryKeys.list({ search, limit, offset, lifecycle, company }),
    queryFn: () => listSalesOrders({ search, limit, offset, lifecycle, company }),
  })
}

export function useSalesOrderSummary(options: Omit<UseSalesOrdersOptions, 'limit' | 'offset'> = {}) {
  const { search = '', lifecycle = 'all', company = 'all' } = options

  return useQuery({
    queryKey: salesOrderQueryKeys.summary({ search, lifecycle, company }),
    queryFn: () => getSalesOrderSummary({ search, lifecycle, company }),
  })
}

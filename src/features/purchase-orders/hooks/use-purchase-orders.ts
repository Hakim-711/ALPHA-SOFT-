import { useQuery } from '@tanstack/react-query'
import { getPurchaseOrderSummary, listPurchaseOrders } from '../api/purchase-orders.api'

interface UsePurchaseOrdersOptions {
  search?: string
  limit?: number
  offset?: number
  lifecycle?: 'draft' | 'submitted' | 'cancelled' | 'all'
  company?: string
}

export const purchaseOrderQueryKeys = {
  all: ['purchase-orders'] as const,
  list: (options: UsePurchaseOrdersOptions) => [...purchaseOrderQueryKeys.all, 'list', options] as const,
  summary: (options: Omit<UsePurchaseOrdersOptions, 'limit' | 'offset'>) =>
    [...purchaseOrderQueryKeys.all, 'summary', options] as const,
  detail: (name?: string) => [...purchaseOrderQueryKeys.all, 'detail', name] as const,
}

export function usePurchaseOrders(options: UsePurchaseOrdersOptions = {}) {
  const { search = '', limit = 20, offset = 0, lifecycle = 'all', company = 'all' } = options

  return useQuery({
    queryKey: purchaseOrderQueryKeys.list({ search, limit, offset, lifecycle, company }),
    queryFn: () => listPurchaseOrders({ search, limit, offset, lifecycle, company }),
  })
}

export function usePurchaseOrderSummary(options: Omit<UsePurchaseOrdersOptions, 'limit' | 'offset'> = {}) {
  const { search = '', lifecycle = 'all', company = 'all' } = options

  return useQuery({
    queryKey: purchaseOrderQueryKeys.summary({ search, lifecycle, company }),
    queryFn: () => getPurchaseOrderSummary({ search, lifecycle, company }),
  })
}



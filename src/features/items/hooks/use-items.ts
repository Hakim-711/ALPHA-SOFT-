import { useQuery } from '@tanstack/react-query'
import { getItemSummary, listItems } from '../api/items.api'

interface UseItemsOptions {
  search?: string
  limit?: number
  offset?: number
  itemGroup?: string
  stockMode?: 'stock' | 'non-stock' | 'all'
  status?: 'active' | 'disabled' | 'all'
}

export const itemQueryKeys = {
  all: ['items'] as const,
  list: (options: UseItemsOptions) => [...itemQueryKeys.all, 'list', options] as const,
  summary: (options: Omit<UseItemsOptions, 'limit' | 'offset'>) => [...itemQueryKeys.all, 'summary', options] as const,
  detail: (name?: string) => ['item', name] as const,
  related: (name?: string) => ['item-related-documents', name] as const,
}

export function useItems(options: UseItemsOptions = {}) {
  const { search = '', limit = 20, offset = 0, itemGroup = 'all', stockMode = 'all', status = 'all' } = options

  return useQuery({
    queryKey: itemQueryKeys.list({ search, limit, offset, itemGroup, stockMode, status }),
    queryFn: () => listItems({ search, limit, offset, itemGroup, stockMode, status }),
  })
}

export function useItemSummary(options: Omit<UseItemsOptions, 'limit' | 'offset'> = {}) {
  const { search = '', itemGroup = 'all', stockMode = 'all', status = 'all' } = options

  return useQuery({
    queryKey: itemQueryKeys.summary({ search, itemGroup, stockMode, status }),
    queryFn: () => getItemSummary({ search, itemGroup, stockMode, status }),
  })
}

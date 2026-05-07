import { useQuery } from '@tanstack/react-query'
import { getCollectionSummary, listCollections } from '../api/collections.api'

interface UseCollectionsOptions {
  search?: string
  lifecycle?: 'draft' | 'submitted' | 'cancelled' | 'all'
  company?: string
  limit?: number
  offset?: number
}

export const collectionQueryKeys = {
  all: ['collections'] as const,
  lists: () => [...collectionQueryKeys.all, 'list'] as const,
  list: (options: UseCollectionsOptions) => [...collectionQueryKeys.lists(), options] as const,
  summary: (options: Omit<UseCollectionsOptions, 'limit' | 'offset'>) =>
    [...collectionQueryKeys.all, 'summary', options] as const,
  details: () => [...collectionQueryKeys.all, 'detail'] as const,
  detail: (name?: string) => [...collectionQueryKeys.details(), name] as const,
  outstanding: (customer?: string, company?: string) => [...collectionQueryKeys.all, 'outstanding', customer, company] as const,
  defaults: () => [...collectionQueryKeys.all, 'defaults'] as const,
}

export function useCollections(options: UseCollectionsOptions = {}) {
  const { search = '', lifecycle = 'all', company = 'all', limit = 20, offset = 0 } = options

  return useQuery({
    queryKey: collectionQueryKeys.list({ search, lifecycle, company, limit, offset }),
    queryFn: () => listCollections({ search, lifecycle, company, limit, offset }),
  })
}

export function useCollectionSummary(options: Omit<UseCollectionsOptions, 'limit' | 'offset'> = {}) {
  const { search = '', lifecycle = 'all', company = 'all' } = options

  return useQuery({
    queryKey: collectionQueryKeys.summary({ search, lifecycle, company }),
    queryFn: () => getCollectionSummary({ search, lifecycle, company }),
  })
}

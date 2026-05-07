import { useQuery } from '@tanstack/react-query'
import { getSupplierSummary, listSuppliers } from '../api/suppliers.api'

interface UseSuppliersOptions {
  search?: string
  limit?: number
  offset?: number
  supplierType?: string
  status?: 'active' | 'disabled' | 'all'
}

export const supplierQueryKeys = {
  all: ['suppliers'] as const,
  list: (options: UseSuppliersOptions) => [...supplierQueryKeys.all, 'list', options] as const,
  summary: (options: UseSuppliersOptions) => [...supplierQueryKeys.all, 'summary', options] as const,
  detail: (name?: string) => ['supplier', name] as const,
  related: (name?: string) => ['supplier-related-documents', name] as const,
}

export function useSuppliers(options: UseSuppliersOptions = {}) {
  const { search = '', limit = 20, offset = 0, supplierType = 'all', status = 'all' } = options

  return useQuery({
    queryKey: supplierQueryKeys.list({ search, limit, offset, supplierType, status }),
    queryFn: () => listSuppliers({ search, limit, offset, supplierType, status }),
  })
}

export function useSupplierSummary(options: Omit<UseSuppliersOptions, 'limit' | 'offset'> = {}) {
  const { search = '', supplierType = 'all', status = 'all' } = options

  return useQuery({
    queryKey: supplierQueryKeys.summary({ search, supplierType, status }),
    queryFn: () => getSupplierSummary({ search, supplierType, status }),
  })
}

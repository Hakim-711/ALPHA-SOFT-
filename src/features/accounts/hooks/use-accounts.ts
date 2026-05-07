import { useQuery } from '@tanstack/react-query'
import { getAccountSummary, listAccounts } from '../api/accounts.api'

interface UseAccountsOptions {
  search?: string
  userType?: 'System User' | 'Website User' | 'all'
  status?: 'active' | 'disabled' | 'all'
  limit?: number
  offset?: number
  enabled?: boolean
}

export function useAccounts(options: UseAccountsOptions = {}) {
  const {
    search = '',
    userType = 'all',
    status = 'all',
    limit = 20,
    offset = 0,
    enabled = true,
  } = options

  return useQuery({
    queryKey: ['accounts', { search, userType, status, limit, offset }],
    queryFn: () => listAccounts({ search, userType, status, limit, offset }),
    enabled,
  })
}

export function useAccountSummary(options: Omit<UseAccountsOptions, 'limit' | 'offset'> = {}) {
  const { search = '', userType = 'all', status = 'all', enabled = true } = options

  return useQuery({
    queryKey: ['accounts-summary', { search, userType, status }],
    queryFn: () => getAccountSummary({ search, userType, status }),
    enabled,
  })
}

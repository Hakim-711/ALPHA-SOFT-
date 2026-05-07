import { useQuery } from '@tanstack/react-query'
import { getAccount } from '../api/accounts.api'

interface UseAccountOptions {
  enabled?: boolean
}

export function useAccount(name?: string, options: UseAccountOptions = {}) {
  return useQuery({
    queryKey: ['account', name],
    queryFn: () => getAccount(name as string),
    enabled: Boolean(name) && (options.enabled ?? true),
  })
}

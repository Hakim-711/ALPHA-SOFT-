import { useQuery } from '@tanstack/react-query'
import { listRoleOptions } from '../api/accounts.api'

interface UseRolesOptions {
  enabled?: boolean
}

export function useRoles(options: UseRolesOptions = {}) {
  return useQuery({
    queryKey: ['role-options'],
    queryFn: listRoleOptions,
    enabled: options.enabled ?? true,
    staleTime: 60_000,
  })
}

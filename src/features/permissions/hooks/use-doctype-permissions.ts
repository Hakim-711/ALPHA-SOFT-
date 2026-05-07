import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { createFallbackPermissions, getDoctypePermissions } from '../api/permissions.api'
import type { DoctypePermissions } from '../types/permissions.types'

export function canUsePermission(permission: boolean | undefined) {
  return permission === true
}

export function useDoctypePermissions(doctype: string): DoctypePermissions {
  const auth = useAuth()
  const userRoles = auth.user?.roles ?? []
  const hasFullAccessRole = auth.user?.name === 'Administrator' || userRoles.includes('Administrator') || userRoles.includes('System Manager')
  const query = useQuery({
    queryKey: ['doctype-permissions', doctype, userRoles],
    queryFn: () => getDoctypePermissions(doctype, userRoles),
    enabled: Boolean(auth.user) && !hasFullAccessRole,
    staleTime: 60_000,
    retry: 0,
  })

  if (hasFullAccessRole) {
    return {
      source: 'server',
      isLoading: false,
      canRead: true,
      canCreate: true,
      canWrite: true,
      canDelete: true,
      canSubmit: true,
      canCancel: true,
    }
  }

  return query.data ?? { ...createFallbackPermissions(), isLoading: query.isLoading }
}

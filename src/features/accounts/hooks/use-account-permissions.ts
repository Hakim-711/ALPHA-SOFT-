import { canUsePermission, useDoctypePermissions } from '@/features/permissions/hooks/use-doctype-permissions'
import type { DoctypePermissions } from '@/features/permissions/types/permissions.types'

export { canUsePermission }

export type AccountPermissions = DoctypePermissions & {
  canManageRoles?: boolean
}

export function useAccountPermissions() {
  const permissions = useDoctypePermissions('User')

  return {
    ...permissions,
    canManageRoles: permissions.canWrite,
  }
}

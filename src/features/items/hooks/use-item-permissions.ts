import { canUsePermission, useDoctypePermissions } from '@/features/permissions/hooks/use-doctype-permissions'
import type { DoctypePermissions } from '@/features/permissions/types/permissions.types'

export { canUsePermission }

export type ItemPermissions = DoctypePermissions & {
  canDisable?: boolean
}

export function useItemPermissions() {
  const permissions = useDoctypePermissions('Item')

  return {
    ...permissions,
    canDisable: permissions.canWrite,
  }
}

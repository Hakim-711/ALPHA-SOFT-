import { canUsePermission, useDoctypePermissions } from '@/features/permissions/hooks/use-doctype-permissions'
import type { DoctypePermissions } from '@/features/permissions/types/permissions.types'

export { canUsePermission }

export type CustomerPermissions = DoctypePermissions & {
  canDisable?: boolean
}

export function useCustomerPermissions() {
  const permissions = useDoctypePermissions('Customer')

  return {
    ...permissions,
    canDisable: permissions.canWrite,
  }
}

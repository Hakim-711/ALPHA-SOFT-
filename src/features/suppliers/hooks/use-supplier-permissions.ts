import { canUsePermission, useDoctypePermissions } from '@/features/permissions/hooks/use-doctype-permissions'
import type { DoctypePermissions } from '@/features/permissions/types/permissions.types'

export { canUsePermission }

export type SupplierPermissions = DoctypePermissions & {
  canDisable?: boolean
}

export function useSupplierPermissions() {
  const permissions = useDoctypePermissions('Supplier')

  return {
    ...permissions,
    canDisable: permissions.canWrite,
  }
}

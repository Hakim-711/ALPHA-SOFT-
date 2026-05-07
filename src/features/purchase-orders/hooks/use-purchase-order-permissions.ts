import { canUsePermission, useDoctypePermissions } from '@/features/permissions/hooks/use-doctype-permissions'
import type { DoctypePermissions } from '@/features/permissions/types/permissions.types'

export { canUsePermission }

export type PurchaseOrderPermissions = DoctypePermissions

export function usePurchaseOrderPermissions() {
  return useDoctypePermissions('Purchase Order')
}



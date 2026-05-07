import { canUsePermission, useDoctypePermissions } from '@/features/permissions/hooks/use-doctype-permissions'
import type { DoctypePermissions } from '@/features/permissions/types/permissions.types'

export { canUsePermission }

export type SalesOrderPermissions = DoctypePermissions

export function useSalesOrderPermissions() {
  return useDoctypePermissions('Sales Order')
}

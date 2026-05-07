import { canUsePermission, useDoctypePermissions } from '@/features/permissions/hooks/use-doctype-permissions'
import type { DoctypePermissions } from '@/features/permissions/types/permissions.types'

export { canUsePermission }

export type StockPermissions = DoctypePermissions

export function useStockPermissions() {
  return useDoctypePermissions('Stock Entry')
}

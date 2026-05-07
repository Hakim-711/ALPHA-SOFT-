import { canUsePermission, useDoctypePermissions } from '@/features/permissions/hooks/use-doctype-permissions'
import type { DoctypePermissions } from '@/features/permissions/types/permissions.types'

export { canUsePermission }

export type SalesInvoicePermissions = DoctypePermissions

export function useSalesInvoicePermissions() {
  return useDoctypePermissions('Sales Invoice')
}

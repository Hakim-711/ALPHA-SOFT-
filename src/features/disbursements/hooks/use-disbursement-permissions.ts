import { useDoctypePermissions } from '@/features/permissions/hooks/use-doctype-permissions'

export function useDisbursementPermissions() {
  return useDoctypePermissions('Payment Entry')
}

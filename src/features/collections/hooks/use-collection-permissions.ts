import { useDoctypePermissions } from '@/features/permissions/hooks/use-doctype-permissions'

export function useCollectionPermissions() {
  return useDoctypePermissions('Payment Entry')
}

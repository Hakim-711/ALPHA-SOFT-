import { useQuery } from '@tanstack/react-query'
import { getDisbursement } from '../api/disbursements.api'
import { disbursementQueryKeys } from './use-disbursements'

export function useDisbursement(name?: string) {
  return useQuery({
    queryKey: disbursementQueryKeys.detail(name),
    queryFn: () => getDisbursement(name as string),
    enabled: Boolean(name),
  })
}

import { useQuery } from '@tanstack/react-query'
import { getDisbursementDefaults } from '../api/disbursements.api'
import { disbursementQueryKeys } from './use-disbursements'

export function useDisbursementDefaults() {
  return useQuery({
    queryKey: disbursementQueryKeys.defaults(),
    queryFn: getDisbursementDefaults,
    staleTime: 60_000,
  })
}

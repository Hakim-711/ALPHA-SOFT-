import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cancelDisbursement } from '../api/disbursements.api'
import type { Disbursement } from '../types/disbursement.types'
import { disbursementQueryKeys } from './use-disbursements'

export function useCancelDisbursement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (disbursement: Disbursement) => cancelDisbursement(disbursement),
    onSuccess: async (disbursement) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: disbursementQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: disbursementQueryKeys.detail(disbursement.name) }),
      ])
    },
  })
}

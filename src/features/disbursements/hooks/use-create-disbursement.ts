import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createDisbursement } from '../api/disbursements.api'
import type { DisbursementFormValues } from '../types/disbursement.types'
import { disbursementQueryKeys } from './use-disbursements'

export function useCreateDisbursement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: DisbursementFormValues) => createDisbursement(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: disbursementQueryKeys.all })
    },
  })
}

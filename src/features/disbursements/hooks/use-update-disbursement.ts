import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateDisbursement } from '../api/disbursements.api'
import type { DisbursementFormValues } from '../types/disbursement.types'
import { disbursementQueryKeys } from './use-disbursements'

interface UpdateDisbursementPayload {
  name: string
  values: DisbursementFormValues
}

export function useUpdateDisbursement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, values }: UpdateDisbursementPayload) => updateDisbursement(name, values),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: disbursementQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: disbursementQueryKeys.detail(variables.name) }),
      ])
    },
  })
}

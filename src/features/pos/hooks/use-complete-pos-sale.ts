import { useMutation, useQueryClient } from '@tanstack/react-query'
import { completePosSale } from '../api/pos.api'
import type { PosSalePayload } from '../types/pos.types'

export function useCompletePosSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PosSalePayload) => completePosSale(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pos'] }),
        queryClient.invalidateQueries({ queryKey: ['sales-invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['collections'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['daily-cash'] }),
      ])
    },
  })
}

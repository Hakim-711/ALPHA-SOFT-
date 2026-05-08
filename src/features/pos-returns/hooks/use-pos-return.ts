import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createPosReturn, getPosReturnSource } from '../api/pos-returns.api'
import type { PosReturnPayload } from '../types/pos-return.types'

export const posReturnQueryKeys = {
  all: ['pos-returns'] as const,
  source: (invoiceName?: string) => [...posReturnQueryKeys.all, 'source', invoiceName] as const,
}

export function usePosReturnSource(invoiceName?: string) {
  const cleanInvoiceName = invoiceName?.trim()

  return useQuery({
    queryKey: posReturnQueryKeys.source(cleanInvoiceName),
    queryFn: () => getPosReturnSource(cleanInvoiceName as string),
    enabled: Boolean(cleanInvoiceName),
    staleTime: 10_000,
    retry: 0,
  })
}

export function useCreatePosReturn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PosReturnPayload) => createPosReturn(payload),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: posReturnQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['sales-invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
        queryClient.invalidateQueries({ queryKey: ['cash-shifts'] }),
        queryClient.invalidateQueries({ queryKey: ['daily-cash'] }),
        queryClient.invalidateQueries({ queryKey: posReturnQueryKeys.source(variables.invoiceName) }),
      ])
    },
  })
}

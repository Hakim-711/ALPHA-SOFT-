import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  closeCashShift,
  getActiveCashShift,
  getCashShiftDefaults,
  getCashShiftSummary,
  listCashShifts,
  openCashShift,
} from '../api/cash-shifts.api'
import type { CashShift, CloseCashShiftValues, OpenCashShiftValues } from '../types/cash-shift.types'

export const cashShiftQueryKeys = {
  all: ['cash-shifts'] as const,
  defaults: () => [...cashShiftQueryKeys.all, 'defaults'] as const,
  list: (status: string, limit: number, offset: number) => [...cashShiftQueryKeys.all, 'list', status, limit, offset] as const,
  active: (posProfile?: string, user?: string) => [...cashShiftQueryKeys.all, 'active', posProfile, user] as const,
  summary: (name?: string) => [...cashShiftQueryKeys.all, 'summary', name] as const,
}

export function useCashShiftDefaults() {
  return useQuery({
    queryKey: cashShiftQueryKeys.defaults(),
    queryFn: getCashShiftDefaults,
    staleTime: 60_000,
  })
}

export function useCashShifts(options: { status?: 'open' | 'closed' | 'all'; limit?: number; offset?: number } = {}) {
  const { status = 'all', limit = 20, offset = 0 } = options

  return useQuery({
    queryKey: cashShiftQueryKeys.list(status, limit, offset),
    queryFn: () => listCashShifts({ status, limit, offset }),
    staleTime: 30_000,
  })
}

export function useActiveCashShift(posProfile?: string, user?: string, enabled = true) {
  return useQuery({
    queryKey: cashShiftQueryKeys.active(posProfile, user),
    queryFn: () => getActiveCashShift(posProfile, user),
    enabled: enabled && Boolean(posProfile || user),
    staleTime: 20_000,
    retry: 0,
  })
}

export function useCashShiftSummary(shift?: CashShift | null) {
  return useQuery({
    queryKey: cashShiftQueryKeys.summary(shift?.name),
    queryFn: () => getCashShiftSummary(shift as CashShift),
    enabled: Boolean(shift),
    staleTime: 15_000,
  })
}

export function useOpenCashShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: OpenCashShiftValues) => openCashShift(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cashShiftQueryKeys.all })
      await queryClient.invalidateQueries({ queryKey: ['pos'] })
    },
  })
}

export function useCloseCashShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: CloseCashShiftValues) => closeCashShift(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cashShiftQueryKeys.all })
      await queryClient.invalidateQueries({ queryKey: ['pos'] })
      await queryClient.invalidateQueries({ queryKey: ['daily-cash'] })
      await queryClient.invalidateQueries({ queryKey: ['reports'] })
    },
  })
}

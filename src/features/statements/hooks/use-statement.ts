import { useQuery } from '@tanstack/react-query'
import { getStatement, getStatementCompanies } from '../api/statements.api'
import type { StatementFilters } from '../types/statement.types'

export const statementQueryKeys = {
  all: ['statements'] as const,
  companies: () => [...statementQueryKeys.all, 'companies'] as const,
  detail: (filters: StatementFilters) => [...statementQueryKeys.all, 'detail', filters] as const,
}

export function useStatement(filters: StatementFilters, enabled: boolean) {
  return useQuery({
    queryKey: statementQueryKeys.detail(filters),
    queryFn: () => getStatement(filters),
    enabled,
  })
}

export function useStatementCompanies() {
  return useQuery({
    queryKey: statementQueryKeys.companies(),
    queryFn: getStatementCompanies,
    staleTime: 120_000,
  })
}

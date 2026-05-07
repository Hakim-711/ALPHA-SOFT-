import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { login, logout, getCurrentSession } from '../api/auth.api'
import type { LoginPayload } from '../types/auth.types'
import { AuthContext } from './auth-context-value'

const authQueryKey = ['auth', 'session'] as const

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient()
  const sessionQuery = useQuery({
    queryKey: authQueryKey,
    queryFn: getCurrentSession,
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authQueryKey })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: logout,
    onMutate: async () => {
      await queryClient.cancelQueries()
      queryClient.setQueryData(authQueryKey, null)
    },
    onSettled: async () => {
      queryClient.removeQueries()
      queryClient.setQueryData(authQueryKey, null)
    },
  })

  async function handleLogin(payload: LoginPayload) {
    await loginMutation.mutateAsync(payload)
    return queryClient.fetchQuery({
      queryKey: authQueryKey,
      queryFn: getCurrentSession,
    })
  }

  async function handleLogout() {
    try {
      await logoutMutation.mutateAsync()
    } finally {
      queryClient.removeQueries()
      queryClient.setQueryData(authQueryKey, null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user: sessionQuery.data ?? null,
        isAuthenticated: Boolean(sessionQuery.data),
        isLoading: sessionQuery.isLoading,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

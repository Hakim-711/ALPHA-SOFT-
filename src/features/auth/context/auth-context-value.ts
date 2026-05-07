import { createContext } from 'react'
import type { LoginPayload, SessionUser } from '../types/auth.types'

export interface AuthContextValue {
  user: SessionUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<SessionUser | null>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)


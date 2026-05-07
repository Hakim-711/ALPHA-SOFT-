import { http } from '@/core/api/http'
import type { FrappeDocResponse } from '@/core/api/types'
import type { LoggedUserResponse, LoginPayload, LoginResponse, SessionUser, UserProfile } from '../types/auth.types'

function mapUserProfile(profile: UserProfile): SessionUser {
  const roles = (profile.roles ?? []).map((row) => row.role).filter((role): role is string => Boolean(role))

  return {
    name: profile.name,
    fullName: profile.full_name || profile.name,
    email: profile.email,
    image: profile.user_image,
    roles: profile.name === 'Administrator' && roles.length === 0 ? ['Administrator', 'System Manager'] : roles,
  }
}

export async function login(payload: LoginPayload) {
  const response = await http.post<LoginResponse>('/method/login', {
    usr: payload.username,
    pwd: payload.password,
  })

  return response.data
}

export async function logout() {
  await http.post('/method/logout')
}

async function getLoggedUser() {
  const response = await http.get<LoggedUserResponse>('/method/frappe.auth.get_logged_user')
  return response.data.message
}

async function getUserProfile(username: string) {
  const response = await http.get<FrappeDocResponse<UserProfile>>(`/resource/User/${encodeURIComponent(username)}`)
  return mapUserProfile(response.data.data)
}

export async function getCurrentSession(): Promise<SessionUser | null> {
  try {
    const username = await getLoggedUser()

    if (!username || username === 'Guest') {
      return null
    }

    try {
      return await getUserProfile(username)
    } catch {
      return {
        name: username,
        fullName: username,
        roles: username === 'Administrator' ? ['Administrator', 'System Manager'] : [],
      }
    }
  } catch {
    return null
  }
}

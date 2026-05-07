export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResponse {
  message?: string
  home_page?: string
  full_name?: string
}

export interface LoggedUserResponse {
  message: string
}

export interface UserRoleRow {
  role?: string
}

export interface UserProfile {
  name: string
  full_name?: string
  email?: string
  user_image?: string
  roles?: UserRoleRow[]
}

export interface SessionUser {
  name: string
  fullName: string
  email?: string
  image?: string
  roles: string[]
}


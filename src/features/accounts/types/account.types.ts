export type AccountUserType = 'System User' | 'Website User'

export interface AccountRoleRow {
  name?: string
  role?: string
  doctype?: 'Has Role'
}

export interface AccountRecord {
  name: string
  email?: string
  first_name?: string
  last_name?: string
  full_name?: string
  username?: string
  mobile_no?: string
  enabled?: 0 | 1
  user_type?: AccountUserType | string
  role_profile_name?: string | null
  send_welcome_email?: 0 | 1
  last_active?: string | null
  last_login?: string | null
  time_zone?: string
  roles?: AccountRoleRow[]
}

export interface AccountFormValues {
  email: string
  first_name: string
  last_name?: string
  username?: string
  mobile_no?: string
  user_type: AccountUserType
  enabled: boolean
  send_welcome_email: boolean
  new_password?: string
  roles: string[]
}

export interface AccountListResult {
  rows: AccountRecord[]
  hasNextPage: boolean
}

export interface AccountSummary {
  totalCount: number
  activeCount: number
  systemCount: number
  websiteCount: number
}

export interface RoleOption {
  name: string
  desk_access?: 0 | 1
  disabled?: 0 | 1
}

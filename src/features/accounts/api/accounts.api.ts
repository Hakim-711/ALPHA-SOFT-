import { http } from '@/core/api/http'
import { getResourceCount } from '@/core/api/resource'
import type { FrappeDocResponse, FrappeListResponse } from '@/core/api/types'
import type {
  AccountFormValues,
  AccountListResult,
  AccountRecord,
  AccountSummary,
  RoleOption,
} from '../types/account.types'

type ListAccountsParams = {
  limit?: number
  offset?: number
  search?: string
  userType?: 'System User' | 'Website User' | 'all'
  status?: 'active' | 'disabled' | 'all'
}

const ACCOUNT_FIELDS = [
  'name',
  'email',
  'first_name',
  'last_name',
  'full_name',
  'username',
  'mobile_no',
  'enabled',
  'user_type',
  'role_profile_name',
  'last_active',
  'last_login',
  'time_zone',
]

function cleanString(value?: string) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : undefined
}

function buildFilters(params: ListAccountsParams) {
  const filters: unknown[] = []

  if (params.userType && params.userType !== 'all') {
    filters.push(['User', 'user_type', '=', params.userType])
  }

  if (params.status === 'active') {
    filters.push(['User', 'enabled', '=', 1])
  }

  if (params.status === 'disabled') {
    filters.push(['User', 'enabled', '=', 0])
  }

  return filters
}

function buildOrFilters(search?: string) {
  const trimmed = search?.trim()

  if (!trimmed) {
    return []
  }

  return [
    ['User', 'name', 'like', `%${trimmed}%`],
    ['User', 'full_name', 'like', `%${trimmed}%`],
    ['User', 'email', 'like', `%${trimmed}%`],
    ['User', 'username', 'like', `%${trimmed}%`],
    ['User', 'mobile_no', 'like', `%${trimmed}%`],
  ]
}

function toRolesPayload(roles: string[]) {
  return roles.map((role) => ({
    doctype: 'Has Role' as const,
    role,
  }))
}

function toAccountPayload(payload: AccountFormValues) {
  return {
    email: payload.email.trim(),
    first_name: payload.first_name.trim(),
    last_name: cleanString(payload.last_name),
    username: cleanString(payload.username),
    mobile_no: cleanString(payload.mobile_no),
    user_type: payload.user_type,
    enabled: payload.enabled ? 1 : 0,
    send_welcome_email: payload.send_welcome_email ? 1 : 0,
    ...(payload.new_password?.trim() ? { new_password: payload.new_password.trim() } : {}),
    roles: toRolesPayload(payload.roles),
  }
}

export function accountToFormValues(account?: AccountRecord): AccountFormValues {
  return {
    email: account?.email ?? account?.name ?? '',
    first_name: account?.first_name ?? account?.full_name ?? '',
    last_name: account?.last_name ?? '',
    username: account?.username ?? '',
    mobile_no: account?.mobile_no ?? '',
    user_type: account?.user_type === 'Website User' ? 'Website User' : 'System User',
    enabled: account?.enabled !== 0,
    send_welcome_email: account?.send_welcome_email === 1,
    new_password: '',
    roles: (account?.roles ?? []).map((row) => row.role).filter((role): role is string => Boolean(role)),
  }
}

export async function listAccounts(params: ListAccountsParams = {}): Promise<AccountListResult> {
  const { limit = 20, offset = 0 } = params
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const response = await http.get<FrappeListResponse<AccountRecord>>('/resource/User', {
    params: {
      fields: JSON.stringify(ACCOUNT_FIELDS),
      limit_start: offset,
      limit_page_length: limit + 1,
      order_by: 'modified desc',
      ...(filters.length > 0 ? { filters: JSON.stringify(filters) } : {}),
      ...(orFilters.length > 0 ? { or_filters: JSON.stringify(orFilters) } : {}),
    },
  })

  return {
    rows: response.data.data.slice(0, limit),
    hasNextPage: response.data.data.length > limit,
  }
}

export async function getAccountSummary(params: ListAccountsParams = {}): Promise<AccountSummary> {
  const filters = buildFilters(params)
  const orFilters = buildOrFilters(params.search)

  const [totalCount, activeCount, systemCount, websiteCount] = await Promise.all([
    getResourceCount('User', { filters, orFilters }),
    getResourceCount('User', {
      filters: [...filters, ['User', 'enabled', '=', 1]],
      orFilters,
    }),
    getResourceCount('User', {
      filters: [...filters, ['User', 'user_type', '=', 'System User']],
      orFilters,
    }),
    getResourceCount('User', {
      filters: [...filters, ['User', 'user_type', '=', 'Website User']],
      orFilters,
    }),
  ])

  return {
    totalCount,
    activeCount,
    systemCount,
    websiteCount,
  }
}

export async function getAccount(name: string) {
  const response = await http.get<FrappeDocResponse<AccountRecord>>(`/resource/User/${encodeURIComponent(name)}`)
  return response.data.data
}

export async function createAccount(payload: AccountFormValues) {
  const response = await http.post<FrappeDocResponse<AccountRecord>>('/resource/User', toAccountPayload(payload))
  return response.data.data
}

export async function updateAccount(name: string, payload: AccountFormValues) {
  const response = await http.put<FrappeDocResponse<AccountRecord>>(
    `/resource/User/${encodeURIComponent(name)}`,
    toAccountPayload(payload),
  )

  return response.data.data
}

export async function listRoleOptions() {
  const response = await http.get<FrappeListResponse<RoleOption>>('/resource/Role', {
    params: {
      fields: JSON.stringify(['name', 'desk_access', 'disabled']),
      filters: JSON.stringify([['Role', 'disabled', '=', 0]]),
      limit_page_length: 500,
      order_by: 'name asc',
    },
  })

  return response.data.data
}

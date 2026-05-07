import { http } from '@/core/api/http'
import type { DoctypePermissions } from '../types/permissions.types'

interface DocPermRow {
  role?: string
  read?: 0 | 1
  create?: 0 | 1
  write?: 0 | 1
  delete?: 0 | 1
  submit?: 0 | 1
  cancel?: 0 | 1
  if_owner?: 0 | 1
}

interface DocTypePermissionDocument {
  permissions?: DocPermRow[]
}

const fullAccessRoles = new Set(['Administrator', 'System Manager'])

export function createFallbackPermissions(): DoctypePermissions {
  return {
    source: 'unknown',
    canRead: false,
    canCreate: false,
    canWrite: false,
    canDelete: false,
    canSubmit: false,
    canCancel: false,
  }
}

function hasFullAccessRole(userRoles: string[]) {
  return userRoles.some((role) => fullAccessRoles.has(role))
}

function rowAppliesToUser(row: DocPermRow, userRoles: string[]) {
  if (!row.role) {
    return false
  }

  if (row.role === 'All') {
    return true
  }

  return userRoles.includes(row.role)
}

function mergeRolePermissions(userRoles: string[], rows: DocPermRow[]): DoctypePermissions {
  if (hasFullAccessRole(userRoles)) {
    return {
      source: 'server',
      canRead: true,
      canCreate: true,
      canWrite: true,
      canDelete: true,
      canSubmit: true,
      canCancel: true,
    }
  }

  const appliedRows = rows.filter((row) => rowAppliesToUser(row, userRoles))

  return {
    source: 'server',
    canRead: appliedRows.some((row) => row.read === 1),
    canCreate: appliedRows.some((row) => row.create === 1),
    canWrite: appliedRows.some((row) => row.write === 1),
    canDelete: appliedRows.some((row) => row.delete === 1),
    canSubmit: appliedRows.some((row) => row.submit === 1),
    canCancel: appliedRows.some((row) => row.cancel === 1),
  }
}

export async function getDoctypePermissions(doctype: string, userRoles: string[]): Promise<DoctypePermissions> {
  if (hasFullAccessRole(userRoles)) {
    return {
      source: 'server',
      canRead: true,
      canCreate: true,
      canWrite: true,
      canDelete: true,
      canSubmit: true,
      canCancel: true,
    }
  }

  try {
    const response = await http.get<{ data: DocTypePermissionDocument }>(`/resource/DocType/${encodeURIComponent(doctype)}`)
    return mergeRolePermissions(userRoles, response.data.data.permissions ?? [])
  } catch {
    // If ERPNext blocks metadata access, keep the UI usable and let the server enforce final authorization.
    return createFallbackPermissions()
  }
}

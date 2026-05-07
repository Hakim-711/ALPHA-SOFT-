export type PermissionType = 'read' | 'create' | 'write' | 'delete' | 'submit' | 'cancel'

export interface PermissionCheckResponse {
  message?: boolean | { has_permission?: boolean }
}

export interface DoctypePermissions {
  source: 'server' | 'unknown'
  isLoading?: boolean
  canRead?: boolean
  canCreate?: boolean
  canWrite?: boolean
  canDelete?: boolean
  canSubmit?: boolean
  canCancel?: boolean
}

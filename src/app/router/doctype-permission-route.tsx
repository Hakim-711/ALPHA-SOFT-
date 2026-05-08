import { ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { canUsePermission, useDoctypePermissions } from '@/features/permissions/hooks/use-doctype-permissions'
import { Loading } from '@/shared/ui/loading'

type PermissionField = 'canRead' | 'canCreate' | 'canWrite' | 'canDelete' | 'canSubmit' | 'canCancel'

interface DoctypePermissionRouteProps {
  children?: ReactNode
  doctype: string
  permission?: PermissionField
  permissions?: PermissionField[]
}

export function DoctypePermissionRoute({ children, doctype, permission = 'canRead', permissions: requiredPermissions }: DoctypePermissionRouteProps) {
  const permissions = useDoctypePermissions(doctype)
  const permissionFields = requiredPermissions ?? [permission]
  const isAllowed = permissionFields.every((field) => canUsePermission(permissions[field]))

  if (permissions.isLoading) {
    return <Loading />
  }

  if (!isAllowed) {
    return (
      <div className="state-block state-error" role="alert">
        <div className="state-heading">
          <ShieldAlert size={22} aria-hidden="true" />
          <div>
            <h3>لا توجد صلاحية كافية</h3>
            <p>حسابك الحالي لا يملك صلاحية فتح هذا الجزء. راجع مدير النظام أو صلاحيات ERPNext.</p>
          </div>
        </div>
      </div>
    )
  }

  return children ?? <Outlet />
}

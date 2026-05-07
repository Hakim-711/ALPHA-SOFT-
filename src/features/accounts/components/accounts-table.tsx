import { Edit, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { formatDateTime } from '@/shared/utils/format'
import { canUsePermission, type AccountPermissions } from '../hooks/use-account-permissions'
import type { AccountRecord } from '../types/account.types'
import { AccountStatusBadge } from './account-status-badge'
import { AccountTypeBadge } from './account-type-badge'

interface AccountsTableProps {
  rows: AccountRecord[]
  permissions?: AccountPermissions
}

function accountPath(account: AccountRecord) {
  return `/accounts/${encodeURIComponent(account.name)}`
}

export function AccountsTable({ rows, permissions = { source: 'unknown' } }: AccountsTableProps) {
  const columns: DataColumn<AccountRecord>[] = [
    {
      key: 'account',
      header: 'الحساب',
      sortValue: (account) => account.full_name || account.name,
      render: (account) => (
        <div className="cell-stack">
          <Link className="record-link" to={accountPath(account)}>
            {account.full_name || account.name}
          </Link>
          <span>{account.name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'البريد',
      sortValue: (account) => account.email || account.name,
      render: (account) => account.email || account.name,
    },
    {
      key: 'mobile',
      header: 'الجوال',
      sortValue: (account) => account.mobile_no,
      render: (account) => account.mobile_no || '-',
    },
    {
      key: 'type',
      header: 'النوع',
      sortValue: (account) => account.user_type,
      render: (account) => <AccountTypeBadge account={account} />,
    },
    {
      key: 'status',
      header: 'الحالة',
      sortValue: (account) => account.enabled ?? 0,
      render: (account) => <AccountStatusBadge account={account} />,
    },
    {
      key: 'lastActive',
      header: 'آخر نشاط',
      sortValue: (account) => account.last_active || account.last_login,
      render: (account) => formatDateTime(account.last_active || account.last_login),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      className: 'actions-cell',
      render: (account) => (
        <div className="row-actions">
          <Link className="icon-button" title="عرض الحساب" to={accountPath(account)}>
            <Eye size={16} aria-hidden="true" />
            <span className="sr-only">عرض</span>
          </Link>
          {canUsePermission(permissions.canWrite) ? (
            <Link className="icon-button" title="تعديل الحساب" to={`${accountPath(account)}/edit`}>
              <Edit size={16} aria-hidden="true" />
              <span className="sr-only">تعديل</span>
            </Link>
          ) : null}
        </div>
      ),
    },
  ]

  return <DataTable columns={columns} data={rows} getRowKey={(account) => account.name} />
}

import { Eye, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DoctypePermissions } from '@/features/permissions/types/permissions.types'
import { canUsePermission } from '@/features/permissions/hooks/use-doctype-permissions'
import { Badge } from '@/shared/ui/badge'
import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { CollectionStatusBadge } from './collection-status-badge'
import type { Collection } from '../types/collection.types'

interface CollectionsTableProps {
  rows: Collection[]
  permissions: DoctypePermissions
}

function collectionPath(name: string) {
  return `/collections/${encodeURIComponent(name)}`
}

export function CollectionsTable({ rows, permissions }: CollectionsTableProps) {
  const columns: DataColumn<Collection>[] = [
    {
      key: 'name',
      header: 'السند',
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="cell-stack">
          <Link className="record-link" to={collectionPath(row.name)}>
            {row.name}
          </Link>
          <span>{row.reference_no || 'بدون مرجع خارجي'}</span>
        </div>
      ),
    },
    {
      key: 'party',
      header: 'العميل',
      sortValue: (row) => row.party_name || row.party,
      render: (row) => (
        <div className="cell-stack">
          <strong>{row.party_name || row.party}</strong>
          <span>{row.company}</span>
        </div>
      ),
    },
    {
      key: 'posting_date',
      header: 'التاريخ',
      sortValue: (row) => row.posting_date,
      render: (row) => (
        <div className="cell-stack">
          <strong>{formatDateTime(row.posting_date)}</strong>
          <span>{row.mode_of_payment || 'بدون طريقة دفع'}</span>
        </div>
      ),
    },
    {
      key: 'amounts',
      header: 'المبالغ',
      sortValue: (row) => row.received_amount,
      render: (row) => (
        <div className="cell-stack">
          <strong>
            {formatMoney(row.received_amount)} {row.paid_to_account_currency || ''}
          </strong>
          <span>
            من العميل: {formatMoney(row.paid_amount)} {row.paid_from_account_currency || ''}
          </span>
        </div>
      ),
    },
    {
      key: 'allocation',
      header: 'التخصيص',
      sortValue: (row) => row.total_allocated_amount ?? 0,
      render: (row) => (
        <div className="cell-stack">
          <strong>{formatMoney(row.total_allocated_amount ?? 0)}</strong>
          <span>غير مخصص: {formatMoney(row.unallocated_amount ?? 0)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      sortValue: (row) => row.docstatus ?? 0,
      render: (row) => (
        <div className="cell-stack">
          <CollectionStatusBadge collection={row} />
          {row.difference_amount ? <Badge tone="red">فرق {formatMoney(row.difference_amount)}</Badge> : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'إجراءات',
      className: 'actions-cell',
      render: (row) => (
        <div className="row-actions">
          <Link className="icon-button elevated" title="عرض السند" to={collectionPath(row.name)}>
            <Eye size={16} aria-hidden="true" />
            <span className="sr-only">عرض السند</span>
          </Link>
          {row.docstatus === 0 && canUsePermission(permissions.canWrite) ? (
            <Link className="icon-button elevated" title="تعديل السند" to={`${collectionPath(row.name)}/edit`}>
              <Pencil size={16} aria-hidden="true" />
              <span className="sr-only">تعديل السند</span>
            </Link>
          ) : null}
        </div>
      ),
    },
  ]

  return <DataTable columns={columns} data={rows} getRowKey={(row) => row.name} />
}

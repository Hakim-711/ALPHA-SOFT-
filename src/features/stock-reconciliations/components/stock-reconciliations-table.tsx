import { Edit, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { formatDateTime } from '@/shared/utils/format'
import { canUsePermission, type StockReconciliationPermissions } from '../hooks/use-stock-reconciliation-permissions'
import type { StockReconciliation } from '../types/stock-reconciliation.types'
import { StockReconciliationPurposeBadge } from './stock-reconciliation-purpose-badge'
import { StockReconciliationStatusBadge } from './stock-reconciliation-status-badge'

interface StockReconciliationsTableProps {
  rows: StockReconciliation[]
  permissions?: StockReconciliationPermissions
}

function documentPath(document: StockReconciliation) {
  return `/stock-reconciliations/${encodeURIComponent(document.name)}`
}

function toPostingDateTime(document: StockReconciliation) {
  const [hours = '00', minutes = '00'] = (document.posting_time ?? '00:00').split(':')
  return `${document.posting_date}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

export function StockReconciliationsTable({
  rows,
  permissions = { source: 'unknown' },
}: StockReconciliationsTableProps) {
  const columns: DataColumn<StockReconciliation>[] = [
    {
      key: 'name',
      header: 'رقم الجرد',
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="cell-stack">
          <Link className="record-link" to={documentPath(row)}>
            {row.name}
          </Link>
          <span>{row.company}</span>
        </div>
      ),
    },
    {
      key: 'purpose',
      header: 'النوع',
      sortValue: (row) => row.purpose,
      render: (row) => <StockReconciliationPurposeBadge purpose={row.purpose} />,
    },
    {
      key: 'posting_date',
      header: 'التاريخ',
      sortValue: (row) => `${row.posting_date} ${row.posting_time}`,
      render: (row) => formatDateTime(toPostingDateTime(row)),
    },
    {
      key: 'expense_account',
      header: 'حساب الفروقات',
      sortValue: (row) => row.expense_account,
      render: (row) => row.expense_account || '-',
    },
    {
      key: 'cost_center',
      header: 'مركز التكلفة',
      sortValue: (row) => row.cost_center,
      render: (row) => row.cost_center || '-',
    },
    {
      key: 'status',
      header: 'الحالة',
      sortValue: (row) => row.docstatus ?? 0,
      render: (row) => <StockReconciliationStatusBadge document={row} />,
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      className: 'actions-cell',
      render: (row) => (
        <div className="row-actions">
          <Link className="icon-button" title="عرض الجرد" to={documentPath(row)}>
            <Eye size={16} aria-hidden="true" />
            <span className="sr-only">عرض</span>
          </Link>
          {row.docstatus === 0 && canUsePermission(permissions.canWrite) ? (
            <Link className="icon-button" title="تعديل الجرد" to={`${documentPath(row)}/edit`}>
              <Edit size={16} aria-hidden="true" />
              <span className="sr-only">تعديل</span>
            </Link>
          ) : null}
        </div>
      ),
    },
  ]

  return <DataTable columns={columns} data={rows} getRowKey={(row) => row.name} />
}

import { Edit, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { canUsePermission, type StockPermissions } from '../hooks/use-stock-permissions'
import type { StockEntry } from '../types/stock.types'
import { StockEntryPurposeBadge } from './stock-entry-purpose-badge'
import { StockEntryStatusBadge } from './stock-entry-status-badge'

interface StockEntriesTableProps {
  rows: StockEntry[]
  permissions?: StockPermissions
}

function stockEntryPath(entry: StockEntry) {
  return `/stock/${encodeURIComponent(entry.name)}`
}

function toPostingDateTime(entry: StockEntry) {
  if (!entry.posting_date) {
    return undefined
  }

  const [hours = '00', minutes = '00'] = (entry.posting_time ?? '00:00').split(':')
  return `${entry.posting_date}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

export function StockEntriesTable({ rows, permissions = { source: 'unknown' } }: StockEntriesTableProps) {
  const columns: DataColumn<StockEntry>[] = [
    {
      key: 'name',
      header: 'رقم الحركة',
      sortValue: (row) => row.name,
      render: (row) => (
        <div className="cell-stack">
          <Link className="record-link" to={stockEntryPath(row)}>
            {row.name}
          </Link>
          <span>{row.stock_entry_type}</span>
        </div>
      ),
    },
    {
      key: 'purpose',
      header: 'النوع',
      sortValue: (row) => row.purpose,
      render: (row) => <StockEntryPurposeBadge purpose={row.purpose} />,
    },
    {
      key: 'company',
      header: 'الشركة',
      sortValue: (row) => row.company,
      render: (row) => row.company,
    },
    {
      key: 'warehouses',
      header: 'المسار',
      sortValue: (row) => `${row.from_warehouse ?? ''} ${row.to_warehouse ?? ''}`,
      render: (row) => (
        <div className="cell-stack">
          <span>{row.from_warehouse || 'بدون مصدر'}</span>
          <strong>{row.to_warehouse || 'بدون هدف'}</strong>
        </div>
      ),
    },
    {
      key: 'posting_date',
      header: 'التاريخ',
      sortValue: (row) => `${row.posting_date ?? ''} ${row.posting_time ?? ''}`,
      render: (row) => formatDateTime(toPostingDateTime(row)),
    },
    {
      key: 'status',
      header: 'الحالة',
      sortValue: (row) => row.docstatus ?? 0,
      render: (row) => <StockEntryStatusBadge entry={row} />,
    },
    {
      key: 'value',
      header: 'القيمة',
      sortValue: (row) => (row.total_incoming_value ?? 0) + (row.total_outgoing_value ?? 0),
      render: (row) => formatMoney((row.total_incoming_value ?? 0) + (row.total_outgoing_value ?? 0)),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      className: 'actions-cell',
      render: (row) => (
        <div className="row-actions">
          <Link className="icon-button" title="عرض الحركة" to={stockEntryPath(row)}>
            <Eye size={16} aria-hidden="true" />
            <span className="sr-only">عرض</span>
          </Link>
          {row.docstatus === 0 && canUsePermission(permissions.canWrite) ? (
            <Link className="icon-button" title="تعديل الحركة" to={`${stockEntryPath(row)}/edit`}>
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

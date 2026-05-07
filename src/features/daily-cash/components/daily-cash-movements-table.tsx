import { ArrowDownLeft, ArrowUpRight, Eye, ReceiptText, Repeat } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/shared/ui/badge'
import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import type { DailyCashMovement } from '../types/daily-cash.types'

interface DailyCashMovementsTableProps {
  rows: DailyCashMovement[]
}

function toneForMovement(row: DailyCashMovement) {
  if (row.type === 'disbursement' || row.type === 'transfer-out') {
    return 'red'
  }

  if (row.type === 'transfer-in') {
    return 'amber'
  }

  return 'green'
}

function iconForMovement(row: DailyCashMovement) {
  if (row.type === 'disbursement' || row.type === 'transfer-out') {
    return <ArrowUpRight size={14} aria-hidden="true" />
  }

  if (row.type === 'transfer-in') {
    return <Repeat size={14} aria-hidden="true" />
  }

  if (row.type === 'pos-sale') {
    return <ReceiptText size={14} aria-hidden="true" />
  }

  return <ArrowDownLeft size={14} aria-hidden="true" />
}

export function DailyCashMovementsTable({ rows }: DailyCashMovementsTableProps) {
  const columns: DataColumn<DailyCashMovement>[] = [
    {
      key: 'label',
      header: 'الحركة',
      sortValue: (row) => row.label,
      render: (row) => (
        <div className="cell-stack">
          <strong>{row.label}</strong>
          <span>{row.reference}</span>
        </div>
      ),
    },
    {
      key: 'party',
      header: 'الطرف / البيان',
      sortValue: (row) => row.party || row.note || '',
      render: (row) => (
        <div className="cell-stack">
          <strong>{row.party || 'بدون طرف مباشر'}</strong>
          <span>{row.note || '—'}</span>
        </div>
      ),
    },
    {
      key: 'account',
      header: 'الحساب',
      sortValue: (row) => row.account,
      render: (row) => (
        <div className="cell-stack">
          <strong>{row.account}</strong>
          <span>{row.counterAccount || 'بدون حساب مقابل'}</span>
        </div>
      ),
    },
    {
      key: 'postingDate',
      header: 'التاريخ',
      sortValue: (row) => row.postingDate,
      render: (row) => formatDateTime(row.postingDate),
    },
    {
      key: 'amount',
      header: 'الأثر',
      sortValue: (row) => row.netAmount,
      render: (row) => (
        <div className="cell-stack">
          <Badge tone={toneForMovement(row)}>
            <span className="inline-icon-label">
              {iconForMovement(row)}
              {row.netAmount >= 0 ? 'داخل' : 'خارج'}
            </span>
          </Badge>
          <strong>
            {row.netAmount >= 0 ? '+' : '-'}
            {formatMoney(Math.abs(row.amount))} {row.currency || ''}
          </strong>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'إجراءات',
      className: 'actions-cell',
      render: (row) =>
        row.path ? (
          <Link className="icon-button elevated" title="عرض المستند" to={row.path}>
            <Eye size={16} aria-hidden="true" />
            <span className="sr-only">عرض المستند</span>
          </Link>
        ) : (
          <span className="muted">—</span>
        ),
    },
  ]

  return <DataTable columns={columns} data={rows} getRowKey={(row) => row.id} />
}

import { Edit, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { canUsePermission, type SalesOrderPermissions } from '../hooks/use-sales-order-permissions'
import type { SalesOrder } from '../types/sales-order.types'
import { SalesOrderStatusBadge } from './sales-order-status-badge'

interface SalesOrdersTableProps {
  rows: SalesOrder[]
  permissions?: SalesOrderPermissions
}

function salesOrderPath(order: SalesOrder) {
  return `/sales-orders/${encodeURIComponent(order.name)}`
}

export function SalesOrdersTable({ rows, permissions = { source: 'unknown' } }: SalesOrdersTableProps) {
  const columns: DataColumn<SalesOrder>[] = [
    {
      key: 'name',
      header: 'رقم الطلب',
      sortValue: (order) => order.name,
      render: (order) => (
        <div className="cell-stack">
          <Link className="record-link" to={salesOrderPath(order)}>
            {order.name}
          </Link>
          <span>{order.customer}</span>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'الشركة',
      sortValue: (order) => order.company,
      render: (order) => order.company || '-',
    },
    {
      key: 'date',
      header: 'التاريخ',
      sortValue: (order) => order.transaction_date,
      render: (order) => formatDateTime(order.transaction_date),
    },
    {
      key: 'status',
      header: 'الحالة',
      sortValue: (order) => order.docstatus ?? 0,
      render: (order) => <SalesOrderStatusBadge order={order} />,
    },
    {
      key: 'amount',
      header: 'الإجمالي',
      sortValue: (order) => order.grand_total ?? 0,
      render: (order) => formatMoney(order.grand_total),
    },
    {
      key: 'modified',
      header: 'آخر تعديل',
      sortValue: (order) => order.modified,
      render: (order) => formatDateTime(order.modified),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      className: 'actions-cell',
      render: (order) => (
        <div className="row-actions">
          <Link className="icon-button" title="عرض الطلب" to={salesOrderPath(order)}>
            <Eye size={16} aria-hidden="true" />
            <span className="sr-only">عرض</span>
          </Link>
          {order.docstatus === 0 && canUsePermission(permissions.canWrite) ? (
            <Link className="icon-button" title="تعديل الطلب" to={`${salesOrderPath(order)}/edit`}>
              <Edit size={16} aria-hidden="true" />
              <span className="sr-only">تعديل</span>
            </Link>
          ) : null}
        </div>
      ),
    },
  ]

  return <DataTable columns={columns} data={rows} getRowKey={(order) => order.name} />
}

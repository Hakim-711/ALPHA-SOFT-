import { Edit, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { canUsePermission, type PurchaseOrderPermissions } from '../hooks/use-purchase-order-permissions'
import type { PurchaseOrder } from '../types/purchase-order.types'
import { PurchaseOrderStatusBadge } from './purchase-order-status-badge'

interface PurchaseOrdersTableProps {
  rows: PurchaseOrder[]
  permissions?: PurchaseOrderPermissions
}

function purchaseOrderPath(order: PurchaseOrder) {
  return `/purchase-orders/${encodeURIComponent(order.name)}`
}

export function PurchaseOrdersTable({ rows, permissions = { source: 'unknown' } }: PurchaseOrdersTableProps) {
  const columns: DataColumn<PurchaseOrder>[] = [
    {
      key: 'name',
      header: 'رقم الطلب',
      sortValue: (order) => order.name,
      render: (order) => (
        <div className="cell-stack">
          <Link className="record-link" to={purchaseOrderPath(order)}>
            {order.name}
          </Link>
          <span>{order.supplier}</span>
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
      render: (order) => <PurchaseOrderStatusBadge order={order} />,
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
          <Link className="icon-button" title="عرض الطلب" to={purchaseOrderPath(order)}>
            <Eye size={16} aria-hidden="true" />
            <span className="sr-only">عرض</span>
          </Link>
          {order.docstatus === 0 && canUsePermission(permissions.canWrite) ? (
            <Link className="icon-button" title="تعديل الطلب" to={`${purchaseOrderPath(order)}/edit`}>
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



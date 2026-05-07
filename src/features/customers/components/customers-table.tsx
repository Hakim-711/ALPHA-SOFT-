import { Edit, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { formatDateTime } from '@/shared/utils/format'
import type { Customer } from '../types/customer.types'
import { canUsePermission, type CustomerPermissions } from '../hooks/use-customer-permissions'
import { CustomerStatusBadge } from './customer-status-badge'
import { CustomerTypeBadge } from './customer-type-badge'

interface CustomersTableProps {
  rows: Customer[]
  permissions?: CustomerPermissions
}

function customerPath(customer: Customer) {
  return `/customers/${encodeURIComponent(customer.name)}`
}

export function CustomersTable({ rows, permissions = { source: 'unknown' } }: CustomersTableProps) {
  const columns: DataColumn<Customer>[] = [
    {
      key: 'name',
      header: 'الاسم',
      sortValue: (customer) => customer.customer_name,
      render: (customer) => (
        <div className="cell-stack">
          <Link className="record-link" to={customerPath(customer)}>
            {customer.customer_name}
          </Link>
          <span>{customer.name}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'النوع',
      sortValue: (customer) => customer.customer_type,
      render: (customer) => <CustomerTypeBadge type={customer.customer_type} />,
    },
    {
      key: 'phone',
      header: 'الهاتف',
      sortValue: (customer) => customer.mobile_no,
      render: (customer) => customer.mobile_no || '-',
    },
    {
      key: 'email',
      header: 'البريد',
      sortValue: (customer) => customer.email_id,
      render: (customer) => customer.email_id || '-',
    },
    {
      key: 'status',
      header: 'الحالة',
      sortValue: (customer) => customer.disabled ?? 0,
      render: (customer) => <CustomerStatusBadge customer={customer} />,
    },
    {
      key: 'modified',
      header: 'آخر تعديل',
      sortValue: (customer) => customer.modified,
      render: (customer) => formatDateTime(customer.modified),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      className: 'actions-cell',
      render: (customer) => (
        <div className="row-actions">
          <Link className="icon-button" title="عرض العميل" to={customerPath(customer)}>
            <Eye size={16} aria-hidden="true" />
            <span className="sr-only">عرض</span>
          </Link>
          {canUsePermission(permissions.canWrite) ? (
            <Link className="icon-button" title="تعديل العميل" to={`${customerPath(customer)}/edit`}>
              <Edit size={16} aria-hidden="true" />
              <span className="sr-only">تعديل</span>
            </Link>
          ) : null}
        </div>
      ),
    },
  ]

  return <DataTable columns={columns} data={rows} getRowKey={(customer) => customer.name} />
}

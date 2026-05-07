import { Edit, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { formatDateTime } from '@/shared/utils/format'
import { canUsePermission, type SupplierPermissions } from '../hooks/use-supplier-permissions'
import type { Supplier } from '../types/supplier.types'
import { SupplierStatusBadge } from './supplier-status-badge'
import { SupplierTypeBadge } from './supplier-type-badge'

interface SuppliersTableProps {
  rows: Supplier[]
  permissions?: SupplierPermissions
}

function supplierPath(supplier: Supplier) {
  return `/suppliers/${encodeURIComponent(supplier.name)}`
}

export function SuppliersTable({ rows, permissions = { source: 'unknown' } }: SuppliersTableProps) {
  const columns: DataColumn<Supplier>[] = [
    {
      key: 'name',
      header: 'الاسم',
      sortValue: (supplier) => supplier.supplier_name,
      render: (supplier) => (
        <div className="cell-stack">
          <Link className="record-link" to={supplierPath(supplier)}>
            {supplier.supplier_name}
          </Link>
          <span>{supplier.name}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'النوع',
      sortValue: (supplier) => supplier.supplier_type,
      render: (supplier) => <SupplierTypeBadge type={supplier.supplier_type} />,
    },
    {
      key: 'phone',
      header: 'الهاتف',
      sortValue: (supplier) => supplier.mobile_no,
      render: (supplier) => supplier.mobile_no || '-',
    },
    {
      key: 'email',
      header: 'البريد',
      sortValue: (supplier) => supplier.email_id,
      render: (supplier) => supplier.email_id || '-',
    },
    {
      key: 'status',
      header: 'الحالة',
      sortValue: (supplier) => supplier.disabled ?? 0,
      render: (supplier) => <SupplierStatusBadge supplier={supplier} />,
    },
    {
      key: 'modified',
      header: 'آخر تعديل',
      sortValue: (supplier) => supplier.modified,
      render: (supplier) => formatDateTime(supplier.modified),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      className: 'actions-cell',
      render: (supplier) => (
        <div className="row-actions">
          <Link className="icon-button" title="عرض المورد" to={supplierPath(supplier)}>
            <Eye size={16} aria-hidden="true" />
            <span className="sr-only">عرض</span>
          </Link>
          {canUsePermission(permissions.canWrite) ? (
            <Link className="icon-button" title="تعديل المورد" to={`${supplierPath(supplier)}/edit`}>
              <Edit size={16} aria-hidden="true" />
              <span className="sr-only">تعديل</span>
            </Link>
          ) : null}
        </div>
      ),
    },
  ]

  return <DataTable columns={columns} data={rows} getRowKey={(supplier) => supplier.name} />
}

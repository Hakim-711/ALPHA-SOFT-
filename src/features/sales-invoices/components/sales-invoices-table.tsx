import { Edit, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { canUsePermission, type SalesInvoicePermissions } from '../hooks/use-sales-invoice-permissions'
import type { SalesInvoice } from '../types/sales-invoice.types'
import { SalesInvoiceStatusBadge } from './sales-invoice-status-badge'

interface SalesInvoicesTableProps {
  rows: SalesInvoice[]
  permissions?: SalesInvoicePermissions
}

function salesInvoicePath(invoice: SalesInvoice) {
  return `/sales-invoices/${encodeURIComponent(invoice.name)}`
}

export function SalesInvoicesTable({ rows, permissions = { source: 'unknown' } }: SalesInvoicesTableProps) {
  const columns: DataColumn<SalesInvoice>[] = [
    {
      key: 'name',
      header: 'رقم الفاتورة',
      sortValue: (invoice) => invoice.name,
      render: (invoice) => (
        <div className="cell-stack">
          <Link className="record-link" to={salesInvoicePath(invoice)}>
            {invoice.name}
          </Link>
          <span>{invoice.customer_name || invoice.customer}</span>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'الشركة',
      sortValue: (invoice) => invoice.company,
      render: (invoice) => invoice.company || '-',
    },
    {
      key: 'posting_date',
      header: 'تاريخ القيد',
      sortValue: (invoice) => invoice.posting_date,
      render: (invoice) => formatDateTime(invoice.posting_date),
    },
    {
      key: 'status',
      header: 'الحالة',
      sortValue: (invoice) => invoice.docstatus ?? 0,
      render: (invoice) => <SalesInvoiceStatusBadge invoice={invoice} />,
    },
    {
      key: 'grand_total',
      header: 'الإجمالي',
      sortValue: (invoice) => invoice.grand_total ?? 0,
      render: (invoice) => formatMoney(invoice.grand_total),
    },
    {
      key: 'outstanding_amount',
      header: 'المستحق',
      sortValue: (invoice) => invoice.outstanding_amount ?? 0,
      render: (invoice) => formatMoney(invoice.outstanding_amount),
    },
    {
      key: 'modified',
      header: 'آخر تعديل',
      sortValue: (invoice) => invoice.modified,
      render: (invoice) => formatDateTime(invoice.modified),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      className: 'actions-cell',
      render: (invoice) => (
        <div className="row-actions">
          <Link className="icon-button" title="عرض الفاتورة" to={salesInvoicePath(invoice)}>
            <Eye size={16} aria-hidden="true" />
            <span className="sr-only">عرض</span>
          </Link>
          {invoice.docstatus === 0 && canUsePermission(permissions.canWrite) ? (
            <Link className="icon-button" title="تعديل الفاتورة" to={`${salesInvoicePath(invoice)}/edit`}>
              <Edit size={16} aria-hidden="true" />
              <span className="sr-only">تعديل</span>
            </Link>
          ) : null}
        </div>
      ),
    },
  ]

  return <DataTable columns={columns} data={rows} getRowKey={(invoice) => invoice.name} />
}

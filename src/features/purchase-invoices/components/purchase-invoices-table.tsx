import { Edit, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { canUsePermission, type PurchaseInvoicePermissions } from '../hooks/use-purchase-invoice-permissions'
import type { PurchaseInvoice } from '../types/purchase-invoice.types'
import { PurchaseInvoiceStatusBadge } from './purchase-invoice-status-badge'

interface PurchaseInvoicesTableProps {
  rows: PurchaseInvoice[]
  permissions?: PurchaseInvoicePermissions
}

function purchaseInvoicePath(invoice: PurchaseInvoice) {
  return `/purchase-invoices/${encodeURIComponent(invoice.name)}`
}

export function PurchaseInvoicesTable({ rows, permissions = { source: 'unknown' } }: PurchaseInvoicesTableProps) {
  const columns: DataColumn<PurchaseInvoice>[] = [
    {
      key: 'name',
      header: 'رقم الفاتورة',
      sortValue: (invoice) => invoice.name,
      render: (invoice) => (
        <div className="cell-stack">
          <Link className="record-link" to={purchaseInvoicePath(invoice)}>
            {invoice.name}
          </Link>
          <span>{invoice.supplier_name || invoice.supplier}</span>
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
      render: (invoice) => <PurchaseInvoiceStatusBadge invoice={invoice} />,
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
          <Link className="icon-button" title="عرض الفاتورة" to={purchaseInvoicePath(invoice)}>
            <Eye size={16} aria-hidden="true" />
            <span className="sr-only">عرض</span>
          </Link>
          {invoice.docstatus === 0 && canUsePermission(permissions.canWrite) ? (
            <Link className="icon-button" title="تعديل الفاتورة" to={`${purchaseInvoicePath(invoice)}/edit`}>
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

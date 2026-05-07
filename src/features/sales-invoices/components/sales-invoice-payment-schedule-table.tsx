import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import type { SalesInvoicePaymentSchedule } from '../types/sales-invoice.types'

export function SalesInvoicePaymentScheduleTable({ rows }: { rows: SalesInvoicePaymentSchedule[] }) {
  const columns: DataColumn<SalesInvoicePaymentSchedule>[] = [
    {
      key: 'due_date',
      header: 'تاريخ الاستحقاق',
      sortValue: (row) => row.due_date,
      render: (row) => formatDateTime(row.due_date),
    },
    {
      key: 'invoice_portion',
      header: 'نسبة الفاتورة',
      sortValue: (row) => row.invoice_portion ?? 0,
      render: (row) => `${row.invoice_portion ?? 0}%`,
    },
    {
      key: 'payment_amount',
      header: 'المبلغ',
      sortValue: (row) => row.payment_amount ?? 0,
      render: (row) => formatMoney(row.payment_amount),
    },
    {
      key: 'paid_amount',
      header: 'المدفوع',
      sortValue: (row) => row.paid_amount ?? 0,
      render: (row) => formatMoney(row.paid_amount),
    },
    {
      key: 'outstanding',
      header: 'المتبقي',
      sortValue: (row) => row.outstanding ?? 0,
      render: (row) => formatMoney(row.outstanding),
    },
  ]

  return <DataTable columns={columns} data={rows} getRowKey={(row) => row.name ?? `${row.due_date}-${row.payment_amount ?? 0}`} />
}

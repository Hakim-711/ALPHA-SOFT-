import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import type { DisbursementReference } from '../types/disbursement.types'

interface DisbursementReferencesTableProps {
  rows: DisbursementReference[]
}

export function DisbursementReferencesTable({ rows }: DisbursementReferencesTableProps) {
  const columns: DataColumn<DisbursementReference>[] = [
    {
      key: 'reference_name',
      header: 'الفاتورة',
      sortValue: (row) => row.reference_name,
      render: (row) => (
        <div className="cell-stack">
          <strong>{row.reference_name}</strong>
          <span>{row.reference_doctype}</span>
        </div>
      ),
    },
    {
      key: 'due_date',
      header: 'الاستحقاق',
      sortValue: (row) => row.due_date,
      render: (row) => formatDateTime(row.due_date),
    },
    {
      key: 'total_amount',
      header: 'إجمالي الفاتورة',
      sortValue: (row) => row.total_amount ?? 0,
      render: (row) => formatMoney(row.total_amount),
    },
    {
      key: 'outstanding_amount',
      header: 'المتبقي',
      sortValue: (row) => row.outstanding_amount ?? 0,
      render: (row) => formatMoney(row.outstanding_amount),
    },
    {
      key: 'allocated_amount',
      header: 'المخصص',
      sortValue: (row) => row.allocated_amount,
      render: (row) => formatMoney(row.allocated_amount),
    },
  ]

  return <DataTable columns={columns} data={rows} getRowKey={(row) => row.name ?? row.reference_name} />
}

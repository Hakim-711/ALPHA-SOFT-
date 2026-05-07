import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import type { StockLedgerMovement } from '../types/stock.types'

function toPostingDateTime(row: StockLedgerMovement) {
  if (!row.posting_date) {
    return undefined
  }

  const [hours = '00', minutes = '00'] = (row.posting_time ?? '00:00').split(':')
  return `${row.posting_date}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
}

interface StockLedgerTableProps {
  rows: StockLedgerMovement[]
}

export function StockLedgerTable({ rows }: StockLedgerTableProps) {
  const columns: DataColumn<StockLedgerMovement>[] = [
    {
      key: 'posting_date',
      header: 'التاريخ',
      sortValue: (row) => `${row.posting_date ?? ''} ${row.posting_time ?? ''}`,
      render: (row) => formatDateTime(toPostingDateTime(row)),
    },
    {
      key: 'item_code',
      header: 'الصنف',
      sortValue: (row) => row.item_code,
      render: (row) => row.item_code || '-',
    },
    {
      key: 'warehouse',
      header: 'المستودع',
      sortValue: (row) => row.warehouse,
      render: (row) => row.warehouse || '-',
    },
    {
      key: 'actual_qty',
      header: 'التغير',
      sortValue: (row) => row.actual_qty ?? 0,
      render: (row) => row.actual_qty ?? 0,
    },
    {
      key: 'qty_after_transaction',
      header: 'الرصيد بعد الحركة',
      sortValue: (row) => row.qty_after_transaction ?? 0,
      render: (row) => row.qty_after_transaction ?? 0,
    },
    {
      key: 'stock_value_difference',
      header: 'فرق القيمة',
      sortValue: (row) => row.stock_value_difference ?? 0,
      render: (row) => formatMoney(row.stock_value_difference),
    },
    {
      key: 'voucher',
      header: 'المستند',
      sortValue: (row) => row.voucher_no,
      render: (row) => (
        <div className="cell-stack">
          <strong>{row.voucher_no || '-'}</strong>
          <span>{row.voucher_type || '-'}</span>
        </div>
      ),
    },
  ]

  return <DataTable columns={columns} data={rows} getRowKey={(row) => row.name} />
}

import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { formatMoney } from '@/shared/utils/format'
import type { StockReconciliationItem } from '../types/stock-reconciliation.types'

interface StockReconciliationItemsTableProps {
  rows: StockReconciliationItem[]
}

export function StockReconciliationItemsTable({ rows }: StockReconciliationItemsTableProps) {
  const columns: DataColumn<StockReconciliationItem>[] = [
    {
      key: 'item_code',
      header: 'الصنف',
      sortValue: (row) => row.item_code,
      render: (row) => (
        <div className="cell-stack">
          <strong>{row.item_code}</strong>
          <span>{row.item_name || '-'}</span>
        </div>
      ),
    },
    {
      key: 'warehouse',
      header: 'المستودع',
      sortValue: (row) => row.warehouse,
      render: (row) => row.warehouse,
    },
    {
      key: 'current_qty',
      header: 'الرصيد الحالي',
      sortValue: (row) => row.current_qty ?? 0,
      render: (row) => row.current_qty ?? 0,
    },
    {
      key: 'qty',
      header: 'الرصيد المعدّل',
      sortValue: (row) => row.qty ?? 0,
      render: (row) => row.qty ?? 0,
    },
    {
      key: 'valuation_rate',
      header: 'سعر التقييم',
      sortValue: (row) => row.valuation_rate ?? 0,
      render: (row) => formatMoney(row.valuation_rate),
    },
    {
      key: 'amount',
      header: 'القيمة',
      sortValue: (row) => row.amount ?? 0,
      render: (row) => formatMoney(row.amount),
    },
  ]

  return <DataTable columns={columns} data={rows} getRowKey={(row) => row.name ?? `${row.item_code}-${row.warehouse}`} />
}

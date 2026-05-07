import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { formatMoney } from '@/shared/utils/format'
import type { StockEntryItem } from '../types/stock.types'

interface StockEntryItemsTableProps {
  rows: StockEntryItem[]
}

export function StockEntryItemsTable({ rows }: StockEntryItemsTableProps) {
  const columns: DataColumn<StockEntryItem>[] = [
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
      key: 's_warehouse',
      header: 'المصدر',
      sortValue: (row) => row.s_warehouse,
      render: (row) => row.s_warehouse || '-',
    },
    {
      key: 't_warehouse',
      header: 'الهدف',
      sortValue: (row) => row.t_warehouse,
      render: (row) => row.t_warehouse || '-',
    },
    {
      key: 'qty',
      header: 'الكمية',
      sortValue: (row) => row.qty,
      render: (row) => row.qty,
    },
    {
      key: 'uom',
      header: 'الوحدة',
      sortValue: (row) => row.uom,
      render: (row) => row.uom || row.stock_uom || '-',
    },
    {
      key: 'basic_rate',
      header: 'السعر',
      sortValue: (row) => row.basic_rate ?? 0,
      render: (row) => formatMoney(row.basic_rate),
    },
  ]

  return <DataTable columns={columns} data={rows} getRowKey={(row) => row.name ?? `${row.item_code}-${row.s_warehouse}-${row.t_warehouse}`} />
}

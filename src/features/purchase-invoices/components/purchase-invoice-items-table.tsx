import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { formatMoney } from '@/shared/utils/format'
import type { PurchaseInvoiceItem } from '../types/purchase-invoice.types'

export function PurchaseInvoiceItemsTable({ rows }: { rows: PurchaseInvoiceItem[] }) {
  const columns: DataColumn<PurchaseInvoiceItem>[] = [
    {
      key: 'item_code',
      header: 'كود الصنف',
      sortValue: (item) => item.item_code,
      render: (item) => item.item_code,
    },
    {
      key: 'item_name',
      header: 'اسم الصنف',
      sortValue: (item) => item.item_name,
      render: (item) => item.item_name,
    },
    {
      key: 'qty',
      header: 'الكمية',
      sortValue: (item) => item.qty,
      render: (item) => item.qty,
    },
    {
      key: 'uom',
      header: 'الوحدة',
      sortValue: (item) => item.uom,
      render: (item) => item.uom,
    },
    {
      key: 'rate',
      header: 'السعر',
      sortValue: (item) => item.rate ?? 0,
      render: (item) => formatMoney(item.rate),
    },
    {
      key: 'purchase_order',
      header: 'أمر الشراء',
      sortValue: (item) => item.purchase_order ?? '',
      render: (item) => item.purchase_order || '-',
    },
    {
      key: 'amount',
      header: 'الإجمالي',
      sortValue: (item) => item.amount ?? 0,
      render: (item) => formatMoney(item.amount),
    },
  ]

  return <DataTable columns={columns} data={rows} getRowKey={(item) => item.name ?? `${item.item_code}-${item.qty}-${item.rate ?? 0}`} />
}

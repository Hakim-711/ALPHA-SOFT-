import { Edit, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { canUsePermission, type ItemPermissions } from '../hooks/use-item-permissions'
import type { Item } from '../types/item.types'
import { ItemStatusBadge } from './item-status-badge'
import { ItemStockBadge } from './item-stock-badge'

interface ItemsTableProps {
  rows: Item[]
  permissions?: ItemPermissions
}

function itemPath(item: Item) {
  return `/items/${encodeURIComponent(item.name)}`
}

export function ItemsTable({ rows, permissions = { source: 'unknown' } }: ItemsTableProps) {
  const columns: DataColumn<Item>[] = [
    {
      key: 'item',
      header: 'الصنف',
      sortValue: (item) => item.item_code,
      render: (item) => (
        <div className="cell-stack">
          <Link className="record-link" to={itemPath(item)}>
            {item.item_code}
          </Link>
          <span>{item.item_name || item.name}</span>
        </div>
      ),
    },
    {
      key: 'group',
      header: 'المجموعة',
      sortValue: (item) => item.item_group,
      render: (item) => item.item_group || '-',
    },
    {
      key: 'uom',
      header: 'وحدة القياس',
      sortValue: (item) => item.stock_uom,
      render: (item) => item.stock_uom || '-',
    },
    {
      key: 'stock',
      header: 'نوع المخزون',
      sortValue: (item) => item.is_stock_item ?? 0,
      render: (item) => <ItemStockBadge item={item} />,
    },
    {
      key: 'rate',
      header: 'سعر البيع',
      sortValue: (item) => item.standard_rate ?? 0,
      render: (item) => formatMoney(item.standard_rate),
    },
    {
      key: 'status',
      header: 'الحالة',
      sortValue: (item) => item.disabled ?? 0,
      render: (item) => <ItemStatusBadge item={item} />,
    },
    {
      key: 'modified',
      header: 'آخر تعديل',
      sortValue: (item) => item.modified,
      render: (item) => formatDateTime(item.modified),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      className: 'actions-cell',
      render: (item) => (
        <div className="row-actions">
          <Link className="icon-button" title="عرض الصنف" to={itemPath(item)}>
            <Eye size={16} aria-hidden="true" />
            <span className="sr-only">عرض</span>
          </Link>
          {canUsePermission(permissions.canWrite) ? (
            <Link className="icon-button" title="تعديل الصنف" to={`${itemPath(item)}/edit`}>
              <Edit size={16} aria-hidden="true" />
              <span className="sr-only">تعديل</span>
            </Link>
          ) : null}
        </div>
      ),
    },
  ]

  return <DataTable columns={columns} data={rows} getRowKey={(item) => item.name} />
}

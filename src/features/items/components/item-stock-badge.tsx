import { Badge } from '@/shared/ui/badge'
import type { Item } from '../types/item.types'

export function ItemStockBadge({ item }: { item: Pick<Item, 'is_stock_item'> }) {
  return item.is_stock_item === 0 ? <Badge tone="neutral">غير مخزني</Badge> : <Badge tone="blue">صنف مخزني</Badge>
}

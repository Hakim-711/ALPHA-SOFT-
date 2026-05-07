import { Badge } from '@/shared/ui/badge'
import type { Item } from '../types/item.types'

export function ItemStatusBadge({ item }: { item: Pick<Item, 'disabled'> }) {
  return item.disabled === 1 ? <Badge tone="red">معطل</Badge> : <Badge tone="green">نشط</Badge>
}

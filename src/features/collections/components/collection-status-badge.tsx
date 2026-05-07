import { Badge } from '@/shared/ui/badge'
import type { Collection } from '../types/collection.types'

interface CollectionStatusBadgeProps {
  collection: Collection
}

export function CollectionStatusBadge({ collection }: CollectionStatusBadgeProps) {
  if (collection.docstatus === 2) {
    return <Badge tone="red">ملغي</Badge>
  }

  if (collection.docstatus === 1) {
    return <Badge tone="green">معتمد</Badge>
  }

  return <Badge tone="amber">مسودة</Badge>
}

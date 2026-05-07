import { Badge } from '@/shared/ui/badge'
import type { StockEntry } from '../types/stock.types'

interface StockEntryStatusBadgeProps {
  entry: StockEntry
}

export function StockEntryStatusBadge({ entry }: StockEntryStatusBadgeProps) {
  if (entry.docstatus === 1) {
    return <Badge tone="green">معتمد</Badge>
  }

  if (entry.docstatus === 2) {
    return <Badge tone="red">ملغي</Badge>
  }

  return <Badge tone="amber">مسودة</Badge>
}

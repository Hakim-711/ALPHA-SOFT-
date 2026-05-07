import { Badge } from '@/shared/ui/badge'
import type { StockReconciliation } from '../types/stock-reconciliation.types'

interface StockReconciliationStatusBadgeProps {
  document: StockReconciliation
}

export function StockReconciliationStatusBadge({ document }: StockReconciliationStatusBadgeProps) {
  if (document.docstatus === 1) {
    return <Badge tone="green">معتمد</Badge>
  }

  if (document.docstatus === 2) {
    return <Badge tone="red">ملغي</Badge>
  }

  return <Badge tone="amber">مسودة</Badge>
}

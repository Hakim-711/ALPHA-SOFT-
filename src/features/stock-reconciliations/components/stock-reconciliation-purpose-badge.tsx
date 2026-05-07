import { Badge } from '@/shared/ui/badge'
import type { StockReconciliationPurpose } from '../types/stock-reconciliation.types'

interface StockReconciliationPurposeBadgeProps {
  purpose?: StockReconciliationPurpose
}

export function StockReconciliationPurposeBadge({ purpose }: StockReconciliationPurposeBadgeProps) {
  if (purpose === 'Opening Stock') {
    return <Badge tone="blue">رصيد افتتاحي</Badge>
  }

  return <Badge tone="neutral">تسوية مخزون</Badge>
}

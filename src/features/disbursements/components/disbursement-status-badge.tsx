import { Badge } from '@/shared/ui/badge'
import type { Disbursement } from '../types/disbursement.types'

interface DisbursementStatusBadgeProps {
  disbursement: Disbursement
}

export function DisbursementStatusBadge({ disbursement }: DisbursementStatusBadgeProps) {
  if (disbursement.docstatus === 2) {
    return <Badge tone="red">ملغي</Badge>
  }

  if (disbursement.docstatus === 1) {
    return <Badge tone="green">معتمد</Badge>
  }

  return <Badge tone="amber">مسودة</Badge>
}

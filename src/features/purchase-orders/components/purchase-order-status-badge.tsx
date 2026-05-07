import { Badge } from '@/shared/ui/badge'
import type { PurchaseOrder } from '../types/purchase-order.types'

function translatePurchaseOrderStatus(status?: string, docstatus?: number) {
  if (docstatus === 0) {
    return 'مسودة'
  }

  if (docstatus === 2) {
    return 'ملغي'
  }

  switch (status) {
    case 'Completed':
      return 'مكتمل'
    case 'To Receive':
      return 'بانتظار الاستلام'
    case 'To Bill':
      return 'بانتظار الفوترة'
    case 'To Receive and Bill':
      return 'بانتظار الاستلام والفوترة'
    case 'On Hold':
      return 'معلق'
    case 'Closed':
      return 'مغلق'
    case 'Submitted':
      return 'معتمد'
    default:
      return status || 'غير محدد'
  }
}

function toneForStatus(status?: string, docstatus?: number): 'neutral' | 'green' | 'amber' | 'red' | 'blue' {
  if (docstatus === 0) {
    return 'amber'
  }

  if (docstatus === 2) {
    return 'red'
  }

  switch (status) {
    case 'Completed':
    case 'Submitted':
      return 'green'
    case 'To Receive':
    case 'To Bill':
    case 'To Receive and Bill':
      return 'blue'
    case 'On Hold':
    case 'Closed':
      return 'amber'
    default:
      return 'neutral'
  }
}

export function PurchaseOrderStatusBadge({ order }: { order: Pick<PurchaseOrder, 'status' | 'docstatus'> }) {
  return <Badge tone={toneForStatus(order.status, order.docstatus)}>{translatePurchaseOrderStatus(order.status, order.docstatus)}</Badge>
}



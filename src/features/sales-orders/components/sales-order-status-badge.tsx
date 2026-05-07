import { Badge } from '@/shared/ui/badge'
import type { SalesOrder } from '../types/sales-order.types'

function translateSalesOrderStatus(status?: string, docstatus?: number) {
  if (docstatus === 0) {
    return 'مسودة'
  }

  if (docstatus === 2) {
    return 'ملغي'
  }

  switch (status) {
    case 'Completed':
      return 'مكتمل'
    case 'To Deliver':
      return 'بانتظار التسليم'
    case 'To Bill':
      return 'بانتظار الفوترة'
    case 'To Deliver and Bill':
      return 'بانتظار التسليم والفوترة'
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
    case 'To Deliver':
    case 'To Bill':
    case 'To Deliver and Bill':
      return 'blue'
    case 'On Hold':
    case 'Closed':
      return 'amber'
    default:
      return 'neutral'
  }
}

export function SalesOrderStatusBadge({ order }: { order: Pick<SalesOrder, 'status' | 'docstatus'> }) {
  return <Badge tone={toneForStatus(order.status, order.docstatus)}>{translateSalesOrderStatus(order.status, order.docstatus)}</Badge>
}

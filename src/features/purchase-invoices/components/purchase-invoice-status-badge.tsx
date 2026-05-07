import { Badge } from '@/shared/ui/badge'
import type { PurchaseInvoice } from '../types/purchase-invoice.types'

function translatePurchaseInvoiceStatus(status?: string, docstatus?: number) {
  if (docstatus === 0) {
    return 'مسودة'
  }

  if (docstatus === 2) {
    return 'ملغي'
  }

  switch (status) {
    case 'Paid':
      return 'مدفوع'
    case 'Unpaid':
      return 'غير مدفوع'
    case 'Overdue':
      return 'متأخر'
    case 'Debit Note Issued':
      return 'مرتجع'
    case 'Return':
      return 'مرتجع'
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
    case 'Paid':
      return 'green'
    case 'Overdue':
      return 'red'
    case 'Unpaid':
    case 'Submitted':
      return 'blue'
    case 'Debit Note Issued':
    case 'Return':
      return 'amber'
    default:
      return 'neutral'
  }
}

export function PurchaseInvoiceStatusBadge({ invoice }: { invoice: Pick<PurchaseInvoice, 'status' | 'docstatus'> }) {
  return <Badge tone={toneForStatus(invoice.status, invoice.docstatus)}>{translatePurchaseInvoiceStatus(invoice.status, invoice.docstatus)}</Badge>
}

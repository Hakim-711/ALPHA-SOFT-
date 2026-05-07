import { Badge } from '@/shared/ui/badge'
import type { SalesInvoice } from '../types/sales-invoice.types'

function translateSalesInvoiceStatus(status?: string, docstatus?: number) {
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
    case 'Credit Note Issued':
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
    case 'Credit Note Issued':
    case 'Return':
      return 'amber'
    default:
      return 'neutral'
  }
}

export function SalesInvoiceStatusBadge({ invoice }: { invoice: Pick<SalesInvoice, 'status' | 'docstatus'> }) {
  return <Badge tone={toneForStatus(invoice.status, invoice.docstatus)}>{translateSalesInvoiceStatus(invoice.status, invoice.docstatus)}</Badge>
}

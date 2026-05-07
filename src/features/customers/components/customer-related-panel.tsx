import { Link } from 'react-router-dom'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { formatMoney } from '@/shared/utils/format'
import { useCustomerRelatedDocuments } from '../hooks/use-customer-related-documents'
import type { RelatedCustomerDocument } from '../types/customer.types'

interface CustomerRelatedPanelProps {
  customerName: string
}

function RelatedList({ title, records, pathPrefix }: { title: string; records: RelatedCustomerDocument[]; pathPrefix: string }) {
  return (
    <section className="related-column">
      <h4>{title}</h4>
      {records.length === 0 ? (
        <p className="muted">لا توجد سجلات مرتبطة.</p>
      ) : (
        <ul className="related-list">
          {records.map((record) => (
            <li key={record.name}>
              <Link to={`${pathPrefix}/${encodeURIComponent(record.name)}`}>{record.name}</Link>
              <span>{record.status || 'الحالة غير محددة'}</span>
              {record.grand_total !== undefined ? <strong>{formatMoney(record.grand_total)}</strong> : null}
              {record.paid_amount !== undefined ? <strong>{formatMoney(record.paid_amount)}</strong> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function CustomerRelatedPanel({ customerName }: CustomerRelatedPanelProps) {
  const relatedQuery = useCustomerRelatedDocuments(customerName)

  if (relatedQuery.isLoading) {
    return <Loading />
  }

  if (relatedQuery.isError) {
    return <ErrorState message={(relatedQuery.error as Error).message} />
  }

  if (!relatedQuery.data) {
    return null
  }

  return (
    <div className="related-grid">
      <RelatedList pathPrefix="/sales-invoices" records={relatedQuery.data.salesInvoices} title="فواتير البيع" />
      <RelatedList pathPrefix="/sales-orders" records={relatedQuery.data.salesOrders} title="أوامر البيع" />
      <RelatedList pathPrefix="/collections" records={relatedQuery.data.payments} title="التحصيلات" />
    </div>
  )
}

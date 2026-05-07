import { Link } from 'react-router-dom'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { formatMoney } from '@/shared/utils/format'
import { useSupplierRelatedDocuments } from '../hooks/use-supplier-related-documents'
import type { RelatedSupplierDocument } from '../types/supplier.types'

interface SupplierRelatedPanelProps {
  supplierName: string
}

function RelatedList({ title, records, pathPrefix }: { title: string; records: RelatedSupplierDocument[]; pathPrefix: string }) {
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
              {record.outstanding_amount !== undefined ? <strong>مستحق {formatMoney(record.outstanding_amount)}</strong> : null}
              {record.paid_amount !== undefined ? <strong>{formatMoney(record.paid_amount)}</strong> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function SupplierRelatedPanel({ supplierName }: SupplierRelatedPanelProps) {
  const relatedQuery = useSupplierRelatedDocuments(supplierName)

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
      <RelatedList pathPrefix="/purchase-orders" records={relatedQuery.data.purchaseOrders} title="أوامر الشراء" />
      <RelatedList pathPrefix="/purchase-invoices" records={relatedQuery.data.purchaseInvoices} title="فواتير الشراء" />
      <RelatedList pathPrefix="/disbursements" records={relatedQuery.data.payments} title="سندات الصرف" />
    </div>
  )
}

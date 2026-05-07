import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { useItemRelatedDocuments } from '../hooks/use-item-related-documents'

interface ItemRelatedPanelProps {
  itemCode: string
}

export function ItemRelatedPanel({ itemCode }: ItemRelatedPanelProps) {
  const relatedQuery = useItemRelatedDocuments(itemCode)

  if (relatedQuery.isLoading) {
    return <Loading />
  }

  if (relatedQuery.isError) {
    return <ErrorState message={(relatedQuery.error as Error).message} />
  }

  const related = relatedQuery.data

  return (
    <div className="related-grid">
      <article className="related-column">
        <h4>الأسعار</h4>
        <ul className="related-list">
          {(related?.prices ?? []).length === 0 ? <li><span>لا توجد أسعار مرتبطة.</span></li> : null}
          {(related?.prices ?? []).map((price) => (
            <li key={price.name}>
              <strong className="record-link">{price.price_list || price.name}</strong>
              <span>{price.currency || ''} {formatMoney(price.price_list_rate)}</span>
              <strong>{price.selling ? 'بيع' : price.buying ? 'شراء' : 'قائمة أسعار'}</strong>
            </li>
          ))}
        </ul>
      </article>

      <article className="related-column">
        <h4>أرصدة المخزون</h4>
        <ul className="related-list">
          {(related?.bins ?? []).length === 0 ? <li><span>لا توجد أرصدة مستودعات.</span></li> : null}
          {(related?.bins ?? []).map((bin) => (
            <li key={bin.name}>
              <strong>{bin.warehouse || bin.name}</strong>
              <span>الفعلي: {formatMoney(bin.actual_qty)} | المتوقع: {formatMoney(bin.projected_qty)}</span>
              <span>المحجوز: {formatMoney(bin.reserved_qty)}</span>
            </li>
          ))}
        </ul>
      </article>

      <article className="related-column">
        <h4>دفتر حركة المخزون</h4>
        <ul className="related-list">
          {(related?.stockLedger ?? []).length === 0 ? <li><span>لا توجد حركات مخزون.</span></li> : null}
          {(related?.stockLedger ?? []).map((entry) => (
            <li key={entry.name}>
              <strong>{entry.voucher_type || 'قيد مخزون'} {entry.voucher_no || ''}</strong>
              <span>{entry.warehouse || '-'} | {formatDateTime(entry.posting_date)}</span>
              <span>الكمية: {formatMoney(entry.actual_qty)} | الرصيد: {formatMoney(entry.qty_after_transaction)}</span>
            </li>
          ))}
        </ul>
      </article>
    </div>
  )
}

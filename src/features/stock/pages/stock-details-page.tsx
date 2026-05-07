import { ArrowLeft, Boxes, Edit, FileCheck2, Power, Receipt, Wallet } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Badge } from '@/shared/ui/badge'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { StockEntryItemsTable } from '../components/stock-entry-items-table'
import { StockLedgerTable } from '../components/stock-ledger-table'
import { StockEntryPurposeBadge } from '../components/stock-entry-purpose-badge'
import { StockEntryStatusBadge } from '../components/stock-entry-status-badge'
import { useCancelStockEntry } from '../hooks/use-cancel-stock-entry'
import { canUsePermission, useStockPermissions } from '../hooks/use-stock-permissions'
import { useStockEntry } from '../hooks/use-stock-entry'
import { useStockEntryLedger } from '../hooks/use-stock-entry-ledger'
import { useSubmitStockEntry } from '../hooks/use-submit-stock-entry'

function FieldLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="detail-line">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  )
}

export default function StockDetailsPage() {
  const { stockEntryId } = useParams()
  const permissions = useStockPermissions()
  const stockEntryQuery = useStockEntry(stockEntryId)
  const stockLedgerQuery = useStockEntryLedger(stockEntryId)
  const submitMutation = useSubmitStockEntry()
  const cancelMutation = useCancelStockEntry()

  if (!stockEntryId) {
    return <Navigate replace to="/stock" />
  }

  if (stockEntryQuery.isLoading) {
    return <Loading />
  }

  if (stockEntryQuery.isError) {
    return <ErrorState message={(stockEntryQuery.error as Error).message} />
  }

  if (!stockEntryQuery.data) {
    return <ErrorState message="لم يتم العثور على حركة المخزون." />
  }

  const entry = stockEntryQuery.data
  const movementDateTime = (() => {
    if (!entry.posting_date) {
      return undefined
    }

    const [hours = '00', minutes = '00'] = (entry.posting_time ?? '00:00').split(':')
    return `${entry.posting_date}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
  })()

  return (
    <>
      <Breadcrumbs items={[{ label: 'حركات المخزون', to: '/stock' }, { label: entry.name }]} />
      <PageHeader
        actions={
          <>
            <Link className="button button-secondary" to="/stock">
              <ArrowLeft size={17} aria-hidden="true" />
              رجوع
            </Link>
            {entry.docstatus === 0 && canUsePermission(permissions.canWrite) ? (
              <Link className="button button-secondary" to={`/stock/${encodeURIComponent(entry.name)}/edit`}>
                <Edit size={17} aria-hidden="true" />
                تعديل
              </Link>
            ) : null}
            {entry.docstatus === 0 && canUsePermission(permissions.canSubmit) ? (
              <button className="button button-primary" disabled={submitMutation.isPending} onClick={() => submitMutation.mutate(entry)}>
                <FileCheck2 size={17} aria-hidden="true" />
                {submitMutation.isPending ? 'جاري الاعتماد' : 'اعتماد'}
              </button>
            ) : null}
            {entry.docstatus === 1 && canUsePermission(permissions.canCancel) ? (
              <button className="button button-danger" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(entry)}>
                <Power size={17} aria-hidden="true" />
                {cancelMutation.isPending ? 'جاري الإلغاء' : 'إلغاء'}
              </button>
            ) : null}
          </>
        }
        eyebrow="نوع المستند: حركة مخزون"
        meta={
          <>
            <StockEntryStatusBadge entry={entry} />
            <StockEntryPurposeBadge purpose={entry.purpose} />
            <Badge tone="neutral">{entry.company}</Badge>
          </>
        }
        subtitle={`معرّف ERPNext: ${entry.name}`}
        title={entry.name}
      />

      {submitMutation.isError ? <ErrorState message={(submitMutation.error as Error).message} /> : null}
      {cancelMutation.isError ? <ErrorState message={(cancelMutation.error as Error).message} /> : null}

      <section className="detail-summary">
        <div className="summary-main">
          <div className="summary-icon">
            <Boxes size={26} aria-hidden="true" />
          </div>
          <div>
            <h3>{entry.stock_entry_type}</h3>
            <p>
              {entry.company} | {formatDateTime(movementDateTime)}
            </p>
          </div>
        </div>
        <div className="summary-badges">
          <StockEntryStatusBadge entry={entry} />
          <StockEntryPurposeBadge purpose={entry.purpose} />
        </div>
      </section>

      <section className="metrics-grid compact" aria-label="ملخص حركة المخزون">
        <MetricCard detail="قيمة المواد الخارجة" icon={Wallet} label="الخارج" tone="red" value={formatMoney(entry.total_outgoing_value)} />
        <MetricCard detail="قيمة المواد الداخلة" icon={Receipt} label="الداخل" tone="green" value={formatMoney(entry.total_incoming_value)} />
        <MetricCard detail="عدد صفوف المستند" icon={Boxes} label="الأصناف" tone="blue" value={entry.items.length} />
      </section>

      <div className="detail-layout">
        <section className="detail-panel">
          <h4>بيانات الحركة</h4>
          <FieldLine label="نوع الحركة" value={entry.stock_entry_type} />
          <FieldLine label="الغرض" value={entry.purpose} />
          <FieldLine label="الشركة" value={entry.company} />
          <FieldLine label="تاريخ الحركة" value={formatDateTime(movementDateTime)} />
          <FieldLine label="سلسلة الترقيم" value={entry.naming_series} />
        </section>

        <section className="detail-panel">
          <h4>المسار والحالة</h4>
          <FieldLine label="المستودع المصدر" value={entry.from_warehouse} />
          <FieldLine label="المستودع الهدف" value={entry.to_warehouse} />
          <FieldLine label="الحالة" value={entry.status || (entry.docstatus === 1 ? 'معتمد' : entry.docstatus === 2 ? 'ملغي' : 'مسودة')} />
          <FieldLine label="المالك" value={entry.owner} />
          <FieldLine label="تاريخ الإنشاء" value={formatDateTime(entry.creation)} />
          <FieldLine label="آخر تعديل" value={formatDateTime(entry.modified)} />
        </section>
      </div>

      <section className="detail-layout">
        <section className="detail-panel">
          <h4>الإجماليات</h4>
          <FieldLine label="إجمالي الخارج" value={formatMoney(entry.total_outgoing_value)} />
          <FieldLine label="إجمالي الداخل" value={formatMoney(entry.total_incoming_value)} />
          <FieldLine label="الإجمالي" value={formatMoney(entry.total_amount)} />
        </section>

        <section className="detail-panel">
          <h4>ملاحظات</h4>
          <p className="muted">{entry.remarks || 'لا توجد ملاحظات إضافية.'}</p>
        </section>
      </section>

      <section className="related-section">
        <div className="section-heading">
          <h4>أصناف الحركة</h4>
          <p>هذه الصفوف مأخوذة من جدول `Stock Entry Detail` داخل ERPNext.</p>
        </div>
        <StockEntryItemsTable rows={entry.items} />
      </section>

      <section className="related-section">
        <div className="section-heading">
          <h4>الحركات الدفترية المرتبطة</h4>
          <p>يعرض هذا القسم السطور التي سجلها ERPNext في `Stock Ledger Entry` لهذا المستند بعد الاعتماد.</p>
        </div>
        {stockLedgerQuery.isLoading ? <Loading /> : null}
        {stockLedgerQuery.isError ? <ErrorState message={(stockLedgerQuery.error as Error).message} /> : null}
        {!stockLedgerQuery.isLoading && !stockLedgerQuery.isError && (stockLedgerQuery.data?.length ?? 0) > 0 ? (
          <StockLedgerTable rows={stockLedgerQuery.data ?? []} />
        ) : null}
        {!stockLedgerQuery.isLoading && !stockLedgerQuery.isError && (stockLedgerQuery.data?.length ?? 0) === 0 ? (
          <div className="inline-alert inline-alert-warning" role="status">
            <span>لا توجد قيود دفترية مخزنية مرتبطة بهذه الحركة حتى الآن. يظهر هذا عادة قبل الاعتماد أو إذا لم ينتج المستند أي حركة فعلية.</span>
          </div>
        ) : null}
      </section>
    </>
  )
}

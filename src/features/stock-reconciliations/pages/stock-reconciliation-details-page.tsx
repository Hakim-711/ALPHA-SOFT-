import { ArrowLeft, ClipboardCheck, Edit, FileCheck2, Power, Scale, Wallet } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Badge } from '@/shared/ui/badge'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { StockReconciliationItemsTable } from '../components/stock-reconciliation-items-table'
import { StockReconciliationPurposeBadge } from '../components/stock-reconciliation-purpose-badge'
import { StockReconciliationStatusBadge } from '../components/stock-reconciliation-status-badge'
import { useCancelStockReconciliation } from '../hooks/use-cancel-stock-reconciliation'
import { canUsePermission, useStockReconciliationPermissions } from '../hooks/use-stock-reconciliation-permissions'
import { useStockReconciliation } from '../hooks/use-stock-reconciliation'
import { useSubmitStockReconciliation } from '../hooks/use-submit-stock-reconciliation'

function FieldLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="detail-line">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  )
}

export default function StockReconciliationDetailsPage() {
  const { stockReconciliationId } = useParams()
  const permissions = useStockReconciliationPermissions()
  const documentQuery = useStockReconciliation(stockReconciliationId)
  const submitMutation = useSubmitStockReconciliation()
  const cancelMutation = useCancelStockReconciliation()

  if (!stockReconciliationId) {
    return <Navigate replace to="/stock-reconciliations" />
  }

  if (documentQuery.isLoading) {
    return <Loading />
  }

  if (documentQuery.isError) {
    return <ErrorState message={(documentQuery.error as Error).message} />
  }

  if (!documentQuery.data) {
    return <ErrorState message="لم يتم العثور على مستند الجرد." />
  }

  const document = documentQuery.data
  const [hours = '00', minutes = '00'] = (document.posting_time ?? '00:00').split(':')
  const postingDateTime = `${document.posting_date}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`
  const totalCurrentAmount = document.items.reduce((sum, item) => sum + (item.current_amount ?? 0), 0)
  const totalAdjustedAmount = document.items.reduce((sum, item) => sum + (item.amount ?? (item.qty ?? 0) * (item.valuation_rate ?? 0)), 0)
  const totalQuantityDelta = document.items.reduce((sum, item) => sum + ((item.qty ?? 0) - (item.current_qty ?? 0)), 0)

  return (
    <>
      <Breadcrumbs items={[{ label: 'الجرد والتسوية', to: '/stock-reconciliations' }, { label: document.name }]} />
      <PageHeader
        actions={
          <>
            <Link className="button button-secondary" to="/stock-reconciliations">
              <ArrowLeft size={17} aria-hidden="true" />
              رجوع
            </Link>
            {document.docstatus === 0 && canUsePermission(permissions.canWrite) ? (
              <Link className="button button-secondary" to={`/stock-reconciliations/${encodeURIComponent(document.name)}/edit`}>
                <Edit size={17} aria-hidden="true" />
                تعديل
              </Link>
            ) : null}
            {document.docstatus === 0 && canUsePermission(permissions.canSubmit) ? (
              <button className="button button-primary" disabled={submitMutation.isPending} onClick={() => submitMutation.mutate(document)}>
                <FileCheck2 size={17} aria-hidden="true" />
                {submitMutation.isPending ? 'جاري الاعتماد' : 'اعتماد'}
              </button>
            ) : null}
            {document.docstatus === 1 && canUsePermission(permissions.canCancel) ? (
              <button className="button button-danger" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(document)}>
                <Power size={17} aria-hidden="true" />
                {cancelMutation.isPending ? 'جاري الإلغاء' : 'إلغاء'}
              </button>
            ) : null}
          </>
        }
        eyebrow="نوع المستند: جرد وتسوية"
        meta={
          <>
            <StockReconciliationStatusBadge document={document} />
            <StockReconciliationPurposeBadge purpose={document.purpose} />
            <Badge tone="neutral">{document.company}</Badge>
          </>
        }
        subtitle={`معرّف ERPNext: ${document.name}`}
        title={document.name}
      />

      {submitMutation.isError ? <ErrorState message={(submitMutation.error as Error).message} /> : null}
      {cancelMutation.isError ? <ErrorState message={(cancelMutation.error as Error).message} /> : null}

      <section className="detail-summary">
        <div className="summary-main">
          <div className="summary-icon">
            <ClipboardCheck size={26} aria-hidden="true" />
          </div>
          <div>
            <h3>{document.purpose === 'Opening Stock' ? 'رصيد افتتاحي' : 'تسوية مخزون'}</h3>
            <p>
              {document.company} | {formatDateTime(postingDateTime)}
            </p>
          </div>
        </div>
        <div className="summary-badges">
          <StockReconciliationStatusBadge document={document} />
          <StockReconciliationPurposeBadge purpose={document.purpose} />
        </div>
      </section>

      <section className="metrics-grid compact" aria-label="ملخص مستند الجرد">
        <MetricCard detail="القيمة الحالية قبل التسوية" icon={Wallet} label="القيمة الحالية" tone="amber" value={formatMoney(totalCurrentAmount)} />
        <MetricCard detail="القيمة بعد اعتماد الجرد" icon={Wallet} label="القيمة المعدّلة" tone="green" value={formatMoney(totalAdjustedAmount)} />
        <MetricCard detail="فرق الكميات بين الحالي والمعدّل" icon={Scale} label="فرق الكمية" tone="blue" value={totalQuantityDelta.toFixed(2)} />
      </section>

      <div className="detail-layout">
        <section className="detail-panel">
          <h4>بيانات الجرد</h4>
          <FieldLine label="الشركة" value={document.company} />
          <FieldLine label="الغرض" value={document.purpose === 'Opening Stock' ? 'رصيد افتتاحي' : 'تسوية مخزون'} />
          <FieldLine label="تاريخ القيد" value={formatDateTime(postingDateTime)} />
          <FieldLine label="سلسلة الترقيم" value={document.naming_series} />
        </section>

        <section className="detail-panel">
          <h4>الربط المالي</h4>
          <FieldLine label="حساب الفروقات" value={document.expense_account} />
          <FieldLine label="مركز التكلفة" value={document.cost_center} />
          <FieldLine label="المالك" value={document.owner} />
          <FieldLine label="تاريخ الإنشاء" value={formatDateTime(document.creation)} />
          <FieldLine label="آخر تعديل" value={formatDateTime(document.modified)} />
        </section>
      </div>

      <section className="detail-layout">
        <section className="detail-panel">
          <h4>ملاحظات</h4>
          <p className="muted">{document.remarks || 'لا توجد ملاحظات إضافية.'}</p>
        </section>
      </section>

      <section className="related-section">
        <div className="section-heading">
          <h4>أصناف الجرد</h4>
          <p>يعرض هذا القسم الرصيد الحالي مقابل الرصيد الذي أدخلته للتسوية داخل `Stock Reconciliation Item`.</p>
        </div>
        <StockReconciliationItemsTable rows={document.items} />
      </section>
    </>
  )
}

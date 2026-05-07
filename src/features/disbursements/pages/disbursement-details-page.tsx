import { ArrowLeft, Edit, FileCheck2, MinusCircle, Power, Scale, Wallet } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Badge } from '@/shared/ui/badge'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { canUsePermission } from '@/features/permissions/hooks/use-doctype-permissions'
import { DisbursementReferencesTable } from '../components/disbursement-references-table'
import { DisbursementStatusBadge } from '../components/disbursement-status-badge'
import { useCancelDisbursement } from '../hooks/use-cancel-disbursement'
import { useDisbursement } from '../hooks/use-disbursement'
import { useDisbursementPermissions } from '../hooks/use-disbursement-permissions'
import { useSubmitDisbursement } from '../hooks/use-submit-disbursement'

function FieldLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="detail-line">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  )
}

export default function DisbursementDetailsPage() {
  const { disbursementId } = useParams()
  const permissions = useDisbursementPermissions()
  const disbursementQuery = useDisbursement(disbursementId)
  const submitMutation = useSubmitDisbursement()
  const cancelMutation = useCancelDisbursement()

  if (!disbursementId) {
    return <Navigate replace to="/disbursements" />
  }

  if (disbursementQuery.isLoading) {
    return <Loading />
  }

  if (disbursementQuery.isError) {
    return <ErrorState message={(disbursementQuery.error as Error).message} />
  }

  if (!disbursementQuery.data) {
    return <ErrorState message="لم يتم العثور على سند الصرف." />
  }

  const disbursement = disbursementQuery.data

  return (
    <>
      <Breadcrumbs items={[{ label: 'سندات الصرف', to: '/disbursements' }, { label: disbursement.name }]} />
      <PageHeader
        actions={
          <>
            <Link className="button button-secondary" to="/disbursements">
              <ArrowLeft size={17} aria-hidden="true" />
              رجوع
            </Link>
            {disbursement.docstatus === 0 && canUsePermission(permissions.canWrite) ? (
              <Link className="button button-secondary" to={`/disbursements/${encodeURIComponent(disbursement.name)}/edit`}>
                <Edit size={17} aria-hidden="true" />
                تعديل
              </Link>
            ) : null}
            {disbursement.docstatus === 0 && canUsePermission(permissions.canSubmit) ? (
              <button className="button button-primary" disabled={submitMutation.isPending} onClick={() => submitMutation.mutate(disbursement)}>
                <FileCheck2 size={17} aria-hidden="true" />
                {submitMutation.isPending ? 'جاري الاعتماد' : 'اعتماد'}
              </button>
            ) : null}
            {disbursement.docstatus === 1 && canUsePermission(permissions.canCancel) ? (
              <button className="button button-danger" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(disbursement)}>
                <Power size={17} aria-hidden="true" />
                {cancelMutation.isPending ? 'جاري الإلغاء' : 'إلغاء'}
              </button>
            ) : null}
          </>
        }
        eyebrow="المالية / سندات الصرف"
        meta={
          <>
            <DisbursementStatusBadge disbursement={disbursement} />
            <Badge tone="neutral">{disbursement.party_name || disbursement.party}</Badge>
          </>
        }
        subtitle={`معرّف ERPNext: ${disbursement.name}`}
        title={disbursement.name}
      />

      {submitMutation.isError ? <ErrorState message={(submitMutation.error as Error).message} /> : null}
      {cancelMutation.isError ? <ErrorState message={(cancelMutation.error as Error).message} /> : null}

      <section className="detail-summary">
        <div className="summary-main">
          <div className="summary-icon">
            <MinusCircle size={26} aria-hidden="true" />
          </div>
          <div>
            <h3>{disbursement.party_name || disbursement.party}</h3>
            <p>
              {disbursement.company} | {formatDateTime(disbursement.posting_date)}
            </p>
          </div>
        </div>
        <div className="summary-badges">
          <DisbursementStatusBadge disbursement={disbursement} />
          <Badge tone="neutral">{disbursement.paid_from_account_currency || '—'}</Badge>
        </div>
      </section>

      <section className="metrics-grid compact" aria-label="ملخص سند الصرف">
        <MetricCard
          detail="الخارج من الحساب"
          icon={Wallet}
          label="المبلغ المدفوع"
          tone="red"
          value={`${formatMoney(disbursement.paid_amount)} ${disbursement.paid_from_account_currency || ''}`}
        />
        <MetricCard
          detail="المخصص على الفواتير"
          icon={FileCheck2}
          label="المبلغ المسوى"
          tone="blue"
          value={`${formatMoney(disbursement.total_allocated_amount ?? 0)} ${disbursement.paid_to_account_currency || ''}`}
        />
        <MetricCard
          detail="الباقي دون تخصيص"
          icon={MinusCircle}
          label="غير مخصص"
          tone="amber"
          value={`${formatMoney(disbursement.unallocated_amount ?? 0)} ${disbursement.paid_to_account_currency || ''}`}
        />
        <MetricCard
          detail="يجب أن يساوي صفرًا قبل الاعتماد"
          icon={Scale}
          label="فرق التسوية"
          tone={(disbursement.difference_amount ?? 0) === 0 ? 'blue' : 'red'}
          value={`${formatMoney(disbursement.difference_amount ?? 0)} ${disbursement.paid_from_account_currency || ''}`}
        />
      </section>

      <div className="detail-layout">
        <section className="detail-panel">
          <h4>بيانات السند</h4>
          <FieldLine label="المورد" value={disbursement.party_name || disbursement.party} />
          <FieldLine label="الشركة" value={disbursement.company} />
          <FieldLine label="طريقة الدفع" value={disbursement.mode_of_payment} />
          <FieldLine label="رقم المرجع" value={disbursement.reference_no} />
          <FieldLine label="تاريخ المرجع" value={formatDateTime(disbursement.reference_date)} />
          <FieldLine label="الحالة" value={disbursement.status} />
        </section>

        <section className="detail-panel">
          <h4>الحسابات والعملات</h4>
          <FieldLine label="حساب الصرف" value={disbursement.paid_from} />
          <FieldLine label="عملة الصرف" value={disbursement.paid_from_account_currency} />
          <FieldLine label="حساب الدائنين" value={disbursement.paid_to} />
          <FieldLine label="عملة المورد" value={disbursement.paid_to_account_currency} />
          <FieldLine label="سعر صرف الصندوق" value={String(disbursement.source_exchange_rate ?? 1)} />
          <FieldLine label="سعر صرف المورد" value={String(disbursement.target_exchange_rate ?? 1)} />
        </section>
      </div>

      <section className="detail-layout">
        <section className="detail-panel">
          <h4>المبالغ</h4>
          <FieldLine
            label="المبلغ المدفوع"
            value={`${formatMoney(disbursement.paid_amount)} ${disbursement.paid_from_account_currency || ''}`}
          />
          <FieldLine
            label="المبلغ المسوى"
            value={`${formatMoney(disbursement.received_amount)} ${disbursement.paid_to_account_currency || ''}`}
          />
          <FieldLine
            label="غير مخصص"
            value={`${formatMoney(disbursement.unallocated_amount ?? 0)} ${disbursement.paid_to_account_currency || ''}`}
          />
          <FieldLine label="المالك" value={disbursement.owner} />
          <FieldLine label="تاريخ الإنشاء" value={formatDateTime(disbursement.creation)} />
          <FieldLine label="آخر تعديل" value={formatDateTime(disbursement.modified)} />
        </section>

        <section className="detail-panel">
          <h4>ملاحظات</h4>
          <p className="muted">{disbursement.remarks || 'لا توجد ملاحظات إضافية.'}</p>
        </section>
      </section>

      <section className="related-section">
        <div className="section-heading">
          <h4>مراجع الفواتير</h4>
          <p>هذه الصفوف مأخوذة من جدول `Payment Entry Reference` داخل ERPNext.</p>
        </div>
        {disbursement.references.length > 0 ? (
          <DisbursementReferencesTable rows={disbursement.references} />
        ) : (
          <div className="inline-alert inline-alert-warning" role="status">
            <span>هذا السند غير مرتبط حاليًا بأي فاتورة، وغالبًا يمثل دفعة مقدمة لمورد.</span>
          </div>
        )}
      </section>
    </>
  )
}

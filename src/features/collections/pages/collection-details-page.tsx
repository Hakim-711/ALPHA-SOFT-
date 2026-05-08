import { ArrowLeft, Edit, FileCheck2, HandCoins, Power, Scale, Wallet } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Badge } from '@/shared/ui/badge'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ConfirmActionButton } from '@/shared/ui/confirm-action-button'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { canUsePermission } from '@/features/permissions/hooks/use-doctype-permissions'
import { CollectionReferencesTable } from '../components/collection-references-table'
import { CollectionStatusBadge } from '../components/collection-status-badge'
import { useCancelCollection } from '../hooks/use-cancel-collection'
import { useCollection } from '../hooks/use-collection'
import { useCollectionPermissions } from '../hooks/use-collection-permissions'
import { useSubmitCollection } from '../hooks/use-submit-collection'

function FieldLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="detail-line">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  )
}

export default function CollectionDetailsPage() {
  const { collectionId } = useParams()
  const permissions = useCollectionPermissions()
  const collectionQuery = useCollection(collectionId)
  const submitMutation = useSubmitCollection()
  const cancelMutation = useCancelCollection()

  if (!collectionId) {
    return <Navigate replace to="/collections" />
  }

  if (collectionQuery.isLoading) {
    return <Loading />
  }

  if (collectionQuery.isError) {
    return <ErrorState message={(collectionQuery.error as Error).message} />
  }

  if (!collectionQuery.data) {
    return <ErrorState message="لم يتم العثور على سند القبض." />
  }

  const collection = collectionQuery.data

  return (
    <>
      <Breadcrumbs items={[{ label: 'التحصيلات', to: '/collections' }, { label: collection.name }]} />
      <PageHeader
        actions={
          <>
            <Link className="button button-secondary" to="/collections">
              <ArrowLeft size={17} aria-hidden="true" />
              رجوع
            </Link>
            {collection.docstatus === 0 && canUsePermission(permissions.canWrite) ? (
              <Link className="button button-secondary" to={`/collections/${encodeURIComponent(collection.name)}/edit`}>
                <Edit size={17} aria-hidden="true" />
                تعديل
              </Link>
            ) : null}
            {collection.docstatus === 0 && canUsePermission(permissions.canSubmit) ? (
              <ConfirmActionButton
                className="button button-primary"
                confirmActionLabel="اعتماد السند"
                confirmMessage="سيتم اعتماد سند القبض داخل ERPNext وربطه بحساب الصندوق والذمم حسب بيانات السند."
                confirmTitle="اعتماد سند القبض؟"
                disabled={submitMutation.isPending}
                onConfirm={() => submitMutation.mutate(collection)}
              >
                <FileCheck2 size={17} aria-hidden="true" />
                {submitMutation.isPending ? 'جاري الاعتماد' : 'اعتماد'}
              </ConfirmActionButton>
            ) : null}
            {collection.docstatus === 1 && canUsePermission(permissions.canCancel) ? (
              <ConfirmActionButton
                className="button button-danger"
                confirmActionLabel="إلغاء السند"
                confirmMessage="إلغاء سند القبض إجراء حساس وقد يعكس أثر التحصيل من الصندوق والذمم."
                confirmTitle="إلغاء سند القبض؟"
                disabled={cancelMutation.isPending}
                onConfirm={() => cancelMutation.mutate(collection)}
              >
                <Power size={17} aria-hidden="true" />
                {cancelMutation.isPending ? 'جاري الإلغاء' : 'إلغاء'}
              </ConfirmActionButton>
            ) : null}
          </>
        }
        eyebrow="المبيعات / التحصيلات"
        meta={
          <>
            <CollectionStatusBadge collection={collection} />
            <Badge tone="neutral">{collection.party_name || collection.party}</Badge>
          </>
        }
        subtitle={`معرّف ERPNext: ${collection.name}`}
        title={collection.name}
      />

      {submitMutation.isError ? <ErrorState message={(submitMutation.error as Error).message} /> : null}
      {cancelMutation.isError ? <ErrorState message={(cancelMutation.error as Error).message} /> : null}

      <section className="detail-summary">
        <div className="summary-main">
          <div className="summary-icon">
            <HandCoins size={26} aria-hidden="true" />
          </div>
          <div>
            <h3>{collection.party_name || collection.party}</h3>
            <p>
              {collection.company} | {formatDateTime(collection.posting_date)}
            </p>
          </div>
        </div>
        <div className="summary-badges">
          <CollectionStatusBadge collection={collection} />
          <Badge tone="neutral">{collection.paid_to_account_currency || '—'}</Badge>
        </div>
      </section>

      <section className="metrics-grid compact" aria-label="ملخص سند القبض">
        <MetricCard
          detail="الداخل إلى الحساب"
          icon={Wallet}
          label="المبلغ المستلم"
          tone="green"
          value={`${formatMoney(collection.received_amount)} ${collection.paid_to_account_currency || ''}`}
        />
        <MetricCard
          detail="المخصص على الفواتير"
          icon={FileCheck2}
          label="المبلغ المخصص"
          tone="blue"
          value={`${formatMoney(collection.total_allocated_amount ?? 0)} ${collection.paid_from_account_currency || ''}`}
        />
        <MetricCard
          detail="الباقي دون تخصيص"
          icon={HandCoins}
          label="غير مخصص"
          tone="amber"
          value={`${formatMoney(collection.unallocated_amount ?? 0)} ${collection.paid_from_account_currency || ''}`}
        />
        <MetricCard
          detail="يجب أن يساوي صفرًا قبل الاعتماد"
          icon={Scale}
          label="فرق التسوية"
          tone={(collection.difference_amount ?? 0) === 0 ? 'blue' : 'red'}
          value={`${formatMoney(collection.difference_amount ?? 0)} ${collection.paid_to_account_currency || ''}`}
        />
      </section>

      <div className="detail-layout">
        <section className="detail-panel">
          <h4>بيانات السند</h4>
          <FieldLine label="العميل" value={collection.party_name || collection.party} />
          <FieldLine label="الشركة" value={collection.company} />
          <FieldLine label="طريقة الدفع" value={collection.mode_of_payment} />
          <FieldLine label="رقم المرجع" value={collection.reference_no} />
          <FieldLine label="تاريخ المرجع" value={formatDateTime(collection.reference_date)} />
          <FieldLine label="الحالة" value={collection.status} />
        </section>

        <section className="detail-panel">
          <h4>الحسابات والعملات</h4>
          <FieldLine label="حساب الذمم" value={collection.paid_from} />
          <FieldLine label="عملة الذمم" value={collection.paid_from_account_currency} />
          <FieldLine label="حساب التحصيل" value={collection.paid_to} />
          <FieldLine label="عملة التحصيل" value={collection.paid_to_account_currency} />
          <FieldLine label="سعر صرف العميل" value={String(collection.source_exchange_rate ?? 1)} />
          <FieldLine label="سعر صرف الصندوق" value={String(collection.target_exchange_rate ?? 1)} />
        </section>
      </div>

      <section className="detail-layout">
        <section className="detail-panel">
          <h4>المبالغ</h4>
          <FieldLine
            label="المبلغ المحصل"
            value={`${formatMoney(collection.paid_amount)} ${collection.paid_from_account_currency || ''}`}
          />
          <FieldLine
            label="المبلغ المستلم"
            value={`${formatMoney(collection.received_amount)} ${collection.paid_to_account_currency || ''}`}
          />
          <FieldLine
            label="غير مخصص"
            value={`${formatMoney(collection.unallocated_amount ?? 0)} ${collection.paid_from_account_currency || ''}`}
          />
          <FieldLine label="المالك" value={collection.owner} />
          <FieldLine label="تاريخ الإنشاء" value={formatDateTime(collection.creation)} />
          <FieldLine label="آخر تعديل" value={formatDateTime(collection.modified)} />
        </section>

        <section className="detail-panel">
          <h4>ملاحظات</h4>
          <p className="muted">{collection.remarks || 'لا توجد ملاحظات إضافية.'}</p>
        </section>
      </section>

      <section className="related-section">
        <div className="section-heading">
          <h4>مراجع الفواتير</h4>
          <p>هذه الصفوف مأخوذة من جدول `Payment Entry Reference` داخل ERPNext.</p>
        </div>
        {collection.references.length > 0 ? (
          <CollectionReferencesTable rows={collection.references} />
        ) : (
          <div className="inline-alert inline-alert-warning" role="status">
            <span>هذا السند غير مرتبط حاليًا بأي فاتورة، وغالبًا يمثل دفعة مقدمة.</span>
          </div>
        )}
      </section>
    </>
  )
}

import { ArrowLeft, Edit, FileCheck2, PackageCheck, Power, ShoppingBasket, Wallet } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Badge } from '@/shared/ui/badge'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { PurchaseOrderItemsTable } from '../components/purchase-order-items-table'
import { PurchaseOrderStatusBadge } from '../components/purchase-order-status-badge'
import { useCancelPurchaseOrder } from '../hooks/use-cancel-purchase-order'
import { canUsePermission, usePurchaseOrderPermissions } from '../hooks/use-purchase-order-permissions'
import { usePurchaseOrder } from '../hooks/use-purchase-order'
import { useSubmitPurchaseOrder } from '../hooks/use-submit-purchase-order'

function FieldLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="detail-line">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  )
}

export default function PurchaseOrderDetailsPage() {
  const { purchaseOrderId } = useParams()
  const permissions = usePurchaseOrderPermissions()
  const purchaseOrderQuery = usePurchaseOrder(purchaseOrderId)
  const submitMutation = useSubmitPurchaseOrder()
  const cancelMutation = useCancelPurchaseOrder()

  if (!purchaseOrderId) {
    return <Navigate replace to="/purchase-orders" />
  }

  if (purchaseOrderQuery.isLoading) {
    return <Loading />
  }

  if (purchaseOrderQuery.isError) {
    return <ErrorState message={(purchaseOrderQuery.error as Error).message} />
  }

  if (!purchaseOrderQuery.data) {
    return <ErrorState message="لم يتم العثور على أمر الشراء." />
  }

  const order = purchaseOrderQuery.data

  return (
    <>
      <Breadcrumbs items={[{ label: 'أوامر الشراء', to: '/purchase-orders' }, { label: order.name }]} />
      <PageHeader
        actions={
          <>
            <Link className="button button-secondary" to="/purchase-orders">
              <ArrowLeft size={17} aria-hidden="true" />
              رجوع
            </Link>
            {order.docstatus === 0 && canUsePermission(permissions.canWrite) ? (
              <Link className="button button-secondary" to={`/purchase-orders/${encodeURIComponent(order.name)}/edit`}>
                <Edit size={17} aria-hidden="true" />
                تعديل
              </Link>
            ) : null}
            {order.docstatus === 0 && canUsePermission(permissions.canSubmit) ? (
              <button
                className="button button-primary"
                disabled={submitMutation.isPending}
                onClick={() => {
                  submitMutation.mutate(order)
                }}
              >
                <FileCheck2 size={17} aria-hidden="true" />
                {submitMutation.isPending ? 'جاري الاعتماد' : 'اعتماد'}
              </button>
            ) : null}
            {order.docstatus === 1 && canUsePermission(permissions.canCancel) ? (
              <button
                className="button button-danger"
                disabled={cancelMutation.isPending}
                onClick={() => {
                  cancelMutation.mutate(order)
                }}
              >
                <Power size={17} aria-hidden="true" />
                {cancelMutation.isPending ? 'جاري الإلغاء' : 'إلغاء'}
              </button>
            ) : null}
          </>
        }
        eyebrow="نوع المستند: أمر شراء"
        meta={
          <>
            <PurchaseOrderStatusBadge order={order} />
            <Badge tone="neutral">{order.supplier}</Badge>
          </>
        }
        subtitle={`معرّف ERPNext: ${order.name}`}
        title={order.name}
      />

      {submitMutation.isError ? <ErrorState message={(submitMutation.error as Error).message} /> : null}
      {cancelMutation.isError ? <ErrorState message={(cancelMutation.error as Error).message} /> : null}

      <section className="detail-summary">
        <div className="summary-main">
          <div className="summary-icon">
            <ShoppingBasket size={26} aria-hidden="true" />
          </div>
          <div>
            <h3>{order.supplier}</h3>
            <p>{order.company} | {formatDateTime(order.transaction_date)}</p>
          </div>
        </div>
        <div className="summary-badges">
          <PurchaseOrderStatusBadge order={order} />
          <Badge tone="neutral">{order.currency}</Badge>
        </div>
      </section>

      <section className="metrics-grid compact" aria-label="مؤشرات أمر الشراء">
        <MetricCard detail="قيمة المستند" icon={Wallet} label="الإجمالي" tone="green" value={formatMoney(order.grand_total)} />
        <MetricCard detail="الاستلام الحالي" icon={PackageCheck} label="نسبة الاستلام" tone="blue" value={`${order.per_received ?? 0}%`} />
        <MetricCard detail="الفوترة الحالية" icon={FileCheck2} label="نسبة الفوترة" tone="amber" value={`${order.per_billed ?? 0}%`} />
      </section>

      <div className="detail-layout">
        <section className="detail-panel">
          <h4>بيانات العمل</h4>
          <FieldLine label="المورد" value={order.supplier} />
          <FieldLine label="الشركة" value={order.company} />
          <FieldLine label="تاريخ الطلب" value={formatDateTime(order.transaction_date)} />
          <FieldLine label="تاريخ التوريد" value={formatDateTime(order.schedule_date)} />
          <FieldLine label="المستودع الافتراضي" value={order.set_warehouse} />
        </section>

        <section className="detail-panel">
          <h4>المالية والحالة</h4>
          <FieldLine label="العملة" value={order.currency} />
          <FieldLine label="قائمة الأسعار" value={order.buying_price_list} />
          <FieldLine label="الحالة" value={order.status} />
          <FieldLine label="المالك" value={order.owner} />
          <FieldLine label="تاريخ الإنشاء" value={formatDateTime(order.creation)} />
          <FieldLine label="آخر تعديل" value={formatDateTime(order.modified)} />
        </section>
      </div>

      <section className="related-section">
        <div className="section-heading">
          <h4>أصناف أمر الشراء</h4>
          <p>هذه الصفوف مأخوذة من جدول `Purchase Order Item` داخل ERPNext.</p>
        </div>
        <PurchaseOrderItemsTable rows={order.items} />
      </section>
    </>
  )
}




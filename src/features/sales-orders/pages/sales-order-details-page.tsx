import { ArrowLeft, Edit, FileCheck2, Power, ShoppingCart, Truck, Wallet } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Badge } from '@/shared/ui/badge'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ConfirmActionButton } from '@/shared/ui/confirm-action-button'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { SalesOrderItemsTable } from '../components/sales-order-items-table'
import { SalesOrderStatusBadge } from '../components/sales-order-status-badge'
import { useCancelSalesOrder } from '../hooks/use-cancel-sales-order'
import { canUsePermission, useSalesOrderPermissions } from '../hooks/use-sales-order-permissions'
import { useSalesOrder } from '../hooks/use-sales-order'
import { useSubmitSalesOrder } from '../hooks/use-submit-sales-order'

function FieldLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="detail-line">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  )
}

export default function SalesOrderDetailsPage() {
  const { salesOrderId } = useParams()
  const permissions = useSalesOrderPermissions()
  const salesOrderQuery = useSalesOrder(salesOrderId)
  const submitMutation = useSubmitSalesOrder()
  const cancelMutation = useCancelSalesOrder()

  if (!salesOrderId) {
    return <Navigate replace to="/sales-orders" />
  }

  if (salesOrderQuery.isLoading) {
    return <Loading />
  }

  if (salesOrderQuery.isError) {
    return <ErrorState message={(salesOrderQuery.error as Error).message} />
  }

  if (!salesOrderQuery.data) {
    return <ErrorState message="لم يتم العثور على أمر البيع." />
  }

  const order = salesOrderQuery.data

  return (
    <>
      <Breadcrumbs items={[{ label: 'أوامر البيع', to: '/sales-orders' }, { label: order.name }]} />
      <PageHeader
        actions={
          <>
            <Link className="button button-secondary" to="/sales-orders">
              <ArrowLeft size={17} aria-hidden="true" />
              رجوع
            </Link>
            {order.docstatus === 0 && canUsePermission(permissions.canWrite) ? (
              <Link className="button button-secondary" to={`/sales-orders/${encodeURIComponent(order.name)}/edit`}>
                <Edit size={17} aria-hidden="true" />
                تعديل
              </Link>
            ) : null}
            {order.docstatus === 0 && canUsePermission(permissions.canSubmit) ? (
              <ConfirmActionButton
                className="button button-primary"
                confirmActionLabel="اعتماد الأمر"
                confirmMessage="سيتم اعتماد أمر البيع داخل ERPNext، وبعدها يصبح جزءًا من دورة البيع والتسليم والفوترة."
                confirmTitle="اعتماد أمر البيع؟"
                disabled={submitMutation.isPending}
                onConfirm={() => submitMutation.mutate(order)}
              >
                <FileCheck2 size={17} aria-hidden="true" />
                {submitMutation.isPending ? 'جاري الاعتماد' : 'اعتماد'}
              </ConfirmActionButton>
            ) : null}
            {order.docstatus === 1 && canUsePermission(permissions.canCancel) ? (
              <ConfirmActionButton
                className="button button-danger"
                confirmActionLabel="إلغاء الأمر"
                confirmMessage="إلغاء أمر البيع إجراء حساس وقد يؤثر على العلاقات اللاحقة مثل التسليم والفوترة."
                confirmTitle="إلغاء أمر البيع؟"
                disabled={cancelMutation.isPending}
                onConfirm={() => cancelMutation.mutate(order)}
              >
                <Power size={17} aria-hidden="true" />
                {cancelMutation.isPending ? 'جاري الإلغاء' : 'إلغاء'}
              </ConfirmActionButton>
            ) : null}
          </>
        }
        eyebrow="نوع المستند: أمر بيع"
        meta={
          <>
            <SalesOrderStatusBadge order={order} />
            <Badge tone="neutral">{order.customer}</Badge>
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
            <ShoppingCart size={26} aria-hidden="true" />
          </div>
          <div>
            <h3>{order.customer}</h3>
            <p>{order.company} | {formatDateTime(order.transaction_date)}</p>
          </div>
        </div>
        <div className="summary-badges">
          <SalesOrderStatusBadge order={order} />
          <Badge tone="neutral">{order.currency}</Badge>
        </div>
      </section>

      <section className="metrics-grid compact" aria-label="مؤشرات أمر البيع">
        <MetricCard detail="قيمة المستند" icon={Wallet} label="الإجمالي" tone="green" value={formatMoney(order.grand_total)} />
        <MetricCard detail="التسليم الحالي" icon={Truck} label="نسبة التسليم" tone="blue" value={`${order.per_delivered ?? 0}%`} />
        <MetricCard detail="الفوترة الحالية" icon={FileCheck2} label="نسبة الفوترة" tone="amber" value={`${order.per_billed ?? 0}%`} />
      </section>

      <div className="detail-layout">
        <section className="detail-panel">
          <h4>بيانات العمل</h4>
          <FieldLine label="العميل" value={order.customer} />
          <FieldLine label="الشركة" value={order.company} />
          <FieldLine label="تاريخ الطلب" value={formatDateTime(order.transaction_date)} />
          <FieldLine label="تاريخ التسليم" value={formatDateTime(order.delivery_date)} />
          <FieldLine label="المستودع الافتراضي" value={order.set_warehouse} />
        </section>

        <section className="detail-panel">
          <h4>المالية والحالة</h4>
          <FieldLine label="العملة" value={order.currency} />
          <FieldLine label="قائمة الأسعار" value={order.selling_price_list} />
          <FieldLine label="الحالة" value={order.status} />
          <FieldLine label="المالك" value={order.owner} />
          <FieldLine label="تاريخ الإنشاء" value={formatDateTime(order.creation)} />
          <FieldLine label="آخر تعديل" value={formatDateTime(order.modified)} />
        </section>
      </div>

      <section className="related-section">
        <div className="section-heading">
          <h4>أصناف أمر البيع</h4>
          <p>هذه الصفوف مأخوذة من جدول `Sales Order Item` داخل ERPNext.</p>
        </div>
        <SalesOrderItemsTable rows={order.items} />
      </section>
    </>
  )
}

import { ArrowLeft, Edit, FileCheck2, Power, ReceiptText, Truck, Wallet } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Badge } from '@/shared/ui/badge'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { SalesInvoiceItemsTable } from '../components/sales-invoice-items-table'
import { SalesInvoicePaymentScheduleTable } from '../components/sales-invoice-payment-schedule-table'
import { SalesInvoiceStatusBadge } from '../components/sales-invoice-status-badge'
import { useCancelSalesInvoice } from '../hooks/use-cancel-sales-invoice'
import { canUsePermission, useSalesInvoicePermissions } from '../hooks/use-sales-invoice-permissions'
import { useSalesInvoice } from '../hooks/use-sales-invoice'
import { useSubmitSalesInvoice } from '../hooks/use-submit-sales-invoice'

function FieldLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="detail-line">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  )
}

export default function SalesInvoiceDetailsPage() {
  const { salesInvoiceId } = useParams()
  const permissions = useSalesInvoicePermissions()
  const salesInvoiceQuery = useSalesInvoice(salesInvoiceId)
  const submitMutation = useSubmitSalesInvoice()
  const cancelMutation = useCancelSalesInvoice()

  if (!salesInvoiceId) {
    return <Navigate replace to="/sales-invoices" />
  }

  if (salesInvoiceQuery.isLoading) {
    return <Loading />
  }

  if (salesInvoiceQuery.isError) {
    return <ErrorState message={(salesInvoiceQuery.error as Error).message} />
  }

  if (!salesInvoiceQuery.data) {
    return <ErrorState message="لم يتم العثور على فاتورة البيع." />
  }

  const invoice = salesInvoiceQuery.data

  return (
    <>
      <Breadcrumbs items={[{ label: 'فواتير البيع', to: '/sales-invoices' }, { label: invoice.name }]} />
      <PageHeader
        actions={
          <>
            <Link className="button button-secondary" to="/sales-invoices">
              <ArrowLeft size={17} aria-hidden="true" />
              رجوع
            </Link>
            {invoice.docstatus === 0 && canUsePermission(permissions.canWrite) ? (
              <Link className="button button-secondary" to={`/sales-invoices/${encodeURIComponent(invoice.name)}/edit`}>
                <Edit size={17} aria-hidden="true" />
                تعديل
              </Link>
            ) : null}
            {invoice.docstatus === 0 && canUsePermission(permissions.canSubmit) ? (
              <button className="button button-primary" disabled={submitMutation.isPending} onClick={() => submitMutation.mutate(invoice)}>
                <FileCheck2 size={17} aria-hidden="true" />
                {submitMutation.isPending ? 'جاري الاعتماد' : 'اعتماد'}
              </button>
            ) : null}
            {invoice.docstatus === 1 && canUsePermission(permissions.canCancel) ? (
              <button className="button button-danger" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate(invoice)}>
                <Power size={17} aria-hidden="true" />
                {cancelMutation.isPending ? 'جاري الإلغاء' : 'إلغاء'}
              </button>
            ) : null}
          </>
        }
        eyebrow="نوع المستند: فاتورة بيع"
        meta={
          <>
            <SalesInvoiceStatusBadge invoice={invoice} />
            <Badge tone="neutral">{invoice.customer_name || invoice.customer}</Badge>
          </>
        }
        subtitle={`معرّف ERPNext: ${invoice.name}`}
        title={invoice.name}
      />

      {submitMutation.isError ? <ErrorState message={(submitMutation.error as Error).message} /> : null}
      {cancelMutation.isError ? <ErrorState message={(cancelMutation.error as Error).message} /> : null}

      <section className="detail-summary">
        <div className="summary-main">
          <div className="summary-icon">
            <ReceiptText size={26} aria-hidden="true" />
          </div>
          <div>
            <h3>{invoice.customer_name || invoice.customer}</h3>
            <p>
              {invoice.company} | {formatDateTime(invoice.posting_date)}
            </p>
          </div>
        </div>
        <div className="summary-badges">
          <SalesInvoiceStatusBadge invoice={invoice} />
          <Badge tone="neutral">{invoice.currency}</Badge>
        </div>
      </section>

      <section className="metrics-grid compact" aria-label="ملخص فاتورة البيع">
        <MetricCard detail="قيمة المستند" icon={Wallet} label="الإجمالي" tone="green" value={formatMoney(invoice.grand_total)} />
        <MetricCard detail="المبلغ المفتوح على العميل" icon={ReceiptText} label="المستحق" tone="red" value={formatMoney(invoice.outstanding_amount)} />
        <MetricCard detail="هل تؤثر على المخزون" icon={Truck} label="المخزون" tone={invoice.update_stock === 1 ? 'blue' : 'amber'} value={invoice.update_stock === 1 ? 'محدث' : 'غير محدث'} />
      </section>

      <div className="detail-layout">
        <section className="detail-panel">
          <h4>بيانات الفاتورة</h4>
          <FieldLine label="العميل" value={invoice.customer_name || invoice.customer} />
          <FieldLine label="الشركة" value={invoice.company} />
          <FieldLine label="تاريخ القيد" value={formatDateTime(invoice.posting_date)} />
          <FieldLine label="تاريخ الاستحقاق" value={formatDateTime(invoice.due_date)} />
          <FieldLine label="المستودع الافتراضي" value={invoice.set_warehouse} />
          <FieldLine label="فاتورة مرتجعة" value={invoice.is_return === 1 ? 'نعم' : 'لا'} />
        </section>

        <section className="detail-panel">
          <h4>المالية والحالة</h4>
          <FieldLine label="العملة" value={invoice.currency} />
          <FieldLine label="قائمة الأسعار" value={invoice.selling_price_list} />
          <FieldLine label="حساب الذمم" value={invoice.debit_to} />
          <FieldLine label="الحالة" value={invoice.status} />
          <FieldLine label="المالك" value={invoice.owner} />
          <FieldLine label="تاريخ الإنشاء" value={formatDateTime(invoice.creation)} />
          <FieldLine label="آخر تعديل" value={formatDateTime(invoice.modified)} />
        </section>
      </div>

      <section className="detail-layout">
        <section className="detail-panel">
          <h4>الإجماليات</h4>
          <FieldLine label="الإجمالي قبل الخصومات" value={formatMoney(invoice.total)} />
          <FieldLine label="صافي الإجمالي" value={formatMoney(invoice.net_total)} />
          <FieldLine label="الإجمالي النهائي" value={formatMoney(invoice.grand_total)} />
          <FieldLine label="التقريب" value={formatMoney(invoice.rounded_total)} />
          <FieldLine label="المستحق" value={formatMoney(invoice.outstanding_amount)} />
        </section>

        <section className="detail-panel">
          <h4>ملاحظات</h4>
          <p className="muted">{invoice.remarks || 'لا توجد ملاحظات إضافية.'}</p>
        </section>
      </section>

      <section className="related-section">
        <div className="section-heading">
          <h4>أصناف الفاتورة</h4>
          <p>هذه الصفوف مأخوذة من جدول `Sales Invoice Item` داخل ERPNext.</p>
        </div>
        <SalesInvoiceItemsTable rows={invoice.items} />
      </section>

      <section className="related-section">
        <div className="section-heading">
          <h4>جدول السداد</h4>
          <p>يعرض كيف يوزع ERPNext الاستحقاق والمبالغ المدفوعة على الفاتورة.</p>
        </div>
        {invoice.payment_schedule.length > 0 ? (
          <SalesInvoicePaymentScheduleTable rows={invoice.payment_schedule} />
        ) : (
          <div className="inline-alert inline-alert-warning" role="status">
            <span>لا يوجد جدول سداد مسجل لهذه الفاتورة.</span>
          </div>
        )}
      </section>
    </>
  )
}

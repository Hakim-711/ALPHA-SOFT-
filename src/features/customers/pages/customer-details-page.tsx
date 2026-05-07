import { ArrowLeft, BadgeCheck, Edit, FileText, Landmark, MapPinned, Power, ReceiptText } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Badge } from '@/shared/ui/badge'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { formatDateTime } from '@/shared/utils/format'
import { CustomerRelatedPanel } from '../components/customer-related-panel'
import { CustomerStatusBadge } from '../components/customer-status-badge'
import { CustomerTypeBadge } from '../components/customer-type-badge'
import { canUsePermission, useCustomerPermissions } from '../hooks/use-customer-permissions'
import { useCustomer } from '../hooks/use-customer'
import { useSetCustomerDisabled } from '../hooks/use-set-customer-disabled'

function FieldLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="detail-line">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  )
}

export default function CustomerDetailsPage() {
  const { customerId } = useParams()
  const permissions = useCustomerPermissions()
  const customerQuery = useCustomer(customerId)
  const setDisabledMutation = useSetCustomerDisabled()

  if (!customerId) {
    return <Navigate replace to="/customers" />
  }

  if (customerQuery.isLoading) {
    return <Loading />
  }

  if (customerQuery.isError) {
    return <ErrorState message={(customerQuery.error as Error).message} />
  }

  if (!customerQuery.data) {
    return <ErrorState message="لم يتم العثور على العميل." />
  }

  const customer = customerQuery.data

  return (
    <>
      <Breadcrumbs items={[{ label: 'العملاء', to: '/customers' }, { label: customer.customer_name }]} />
      <PageHeader
        actions={
          <>
            <Link className="button button-secondary" to="/customers">
              <ArrowLeft size={17} aria-hidden="true" />
              رجوع
            </Link>
            <Link className="button button-secondary" to={`/statements?partyType=Customer&party=${encodeURIComponent(customer.name)}`}>
              <FileText size={17} aria-hidden="true" />
              كشف حساب
            </Link>
            {canUsePermission(permissions.canWrite) ? (
              <Link className="button button-secondary" to={`/customers/${encodeURIComponent(customer.name)}/edit`}>
                <Edit size={17} aria-hidden="true" />
                تعديل
              </Link>
            ) : null}
            {canUsePermission(permissions.canDisable) ? (
              <button
                className="button button-danger"
                disabled={setDisabledMutation.isPending}
                onClick={() => {
                  setDisabledMutation.mutate({
                    name: customer.name,
                    disabled: customer.disabled !== 1,
                  })
                }}
              >
                <Power size={17} aria-hidden="true" />
                {customer.disabled ? 'تفعيل' : 'تعطيل'}
              </button>
            ) : null}
          </>
        }
        eyebrow="نوع المستند: العميل"
        meta={
          <>
            <CustomerTypeBadge type={customer.customer_type} />
            <CustomerStatusBadge customer={customer} />
          </>
        }
        subtitle={`معرّف ERPNext: ${customer.name}`}
        title={customer.customer_name}
      />

      {setDisabledMutation.isError ? <ErrorState message={(setDisabledMutation.error as Error).message} /> : null}

      <section className="detail-summary">
        <div className="summary-main">
          <div className="summary-icon">
            <ReceiptText size={26} aria-hidden="true" />
          </div>
          <div>
            <h3>{customer.customer_name}</h3>
            <p>{customer.name}</p>
          </div>
        </div>
        <div className="summary-badges">
          <CustomerTypeBadge type={customer.customer_type} />
          <CustomerStatusBadge customer={customer} />
          <Badge tone="neutral">بيانات أساسية</Badge>
        </div>
      </section>

      <section className="metrics-grid compact" aria-label="مؤشرات العميل">
        <MetricCard detail="نوع العميل" icon={BadgeCheck} label="النوع" tone="blue" value={customer.customer_type === 'Company' ? 'شركة' : 'فرد'} />
        <MetricCard detail="تصنيف المبيعات" icon={Landmark} label="المجموعة" value={customer.customer_group || '-'} />
        <MetricCard detail="منطقة السوق" icon={MapPinned} label="المنطقة" tone="amber" value={customer.territory || '-'} />
      </section>

      <div className="detail-layout">
        <section className="detail-panel">
          <h4>بيانات العمل</h4>
          <FieldLine label="المجموعة" value={customer.customer_group} />
          <FieldLine label="المنطقة" value={customer.territory} />
          <FieldLine label="الرقم الضريبي" value={customer.tax_id} />
          <FieldLine label="المالك" value={customer.owner} />
          <FieldLine label="تاريخ الإنشاء" value={formatDateTime(customer.creation)} />
          <FieldLine label="آخر تعديل" value={formatDateTime(customer.modified)} />
        </section>

        <section className="detail-panel">
          <h4>التواصل</h4>
          <FieldLine label="الهاتف" value={customer.mobile_no} />
          <FieldLine label="البريد" value={customer.email_id} />
          <FieldLine label="العنوان الرئيسي" value={customer.customer_primary_address ?? customer.primary_address ?? customer.address} />
        </section>
      </div>

      <section className="related-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">سجلات مرتبطة من السيرفر</p>
            <h4>المستندات المرتبطة</h4>
          </div>
        </div>
        <CustomerRelatedPanel customerName={customer.name} />
      </section>
    </>
  )
}

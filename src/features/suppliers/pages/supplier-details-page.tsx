import { ArrowLeft, BadgeCheck, Edit, FileText, Landmark, MapPinned, Power, ReceiptText } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Badge } from '@/shared/ui/badge'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { formatDateTime } from '@/shared/utils/format'
import { SupplierRelatedPanel } from '../components/supplier-related-panel'
import { SupplierStatusBadge } from '../components/supplier-status-badge'
import { SupplierTypeBadge } from '../components/supplier-type-badge'
import { canUsePermission, useSupplierPermissions } from '../hooks/use-supplier-permissions'
import { useSetSupplierDisabled } from '../hooks/use-set-supplier-disabled'
import { useSupplier } from '../hooks/use-supplier'

function FieldLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="detail-line">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  )
}

export default function SupplierDetailsPage() {
  const { supplierId } = useParams()
  const permissions = useSupplierPermissions()
  const supplierQuery = useSupplier(supplierId)
  const setDisabledMutation = useSetSupplierDisabled()

  if (!supplierId) {
    return <Navigate replace to="/suppliers" />
  }

  if (supplierQuery.isLoading) {
    return <Loading />
  }

  if (supplierQuery.isError) {
    return <ErrorState message={(supplierQuery.error as Error).message} />
  }

  if (!supplierQuery.data) {
    return <ErrorState message="لم يتم العثور على المورد." />
  }

  const supplier = supplierQuery.data

  return (
    <>
      <Breadcrumbs items={[{ label: 'الموردون', to: '/suppliers' }, { label: supplier.supplier_name }]} />
      <PageHeader
        actions={
          <>
            <Link className="button button-secondary" to="/suppliers">
              <ArrowLeft size={17} aria-hidden="true" />
              رجوع
            </Link>
            <Link className="button button-secondary" to={`/statements?partyType=Supplier&party=${encodeURIComponent(supplier.name)}`}>
              <FileText size={17} aria-hidden="true" />
              كشف حساب
            </Link>
            {canUsePermission(permissions.canWrite) ? (
              <Link className="button button-secondary" to={`/suppliers/${encodeURIComponent(supplier.name)}/edit`}>
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
                    name: supplier.name,
                    disabled: supplier.disabled !== 1,
                  })
                }}
              >
                <Power size={17} aria-hidden="true" />
                {supplier.disabled ? 'تفعيل' : 'تعطيل'}
              </button>
            ) : null}
          </>
        }
        eyebrow="نوع المستند: المورد"
        meta={
          <>
            <SupplierTypeBadge type={supplier.supplier_type} />
            <SupplierStatusBadge supplier={supplier} />
          </>
        }
        subtitle={`معرّف ERPNext: ${supplier.name}`}
        title={supplier.supplier_name}
      />

      {setDisabledMutation.isError ? <ErrorState message={(setDisabledMutation.error as Error).message} /> : null}

      <section className="detail-summary">
        <div className="summary-main">
          <div className="summary-icon">
            <ReceiptText size={26} aria-hidden="true" />
          </div>
          <div>
            <h3>{supplier.supplier_name}</h3>
            <p>{supplier.name}</p>
          </div>
        </div>
        <div className="summary-badges">
          <SupplierTypeBadge type={supplier.supplier_type} />
          <SupplierStatusBadge supplier={supplier} />
          <Badge tone="neutral">بيانات أساسية</Badge>
        </div>
      </section>

      <section className="metrics-grid compact" aria-label="مؤشرات المورد">
        <MetricCard detail="نوع المورد" icon={BadgeCheck} label="النوع" tone="blue" value={supplier.supplier_type === 'Company' ? 'شركة' : 'فرد'} />
        <MetricCard detail="تصنيف الشراء" icon={Landmark} label="المجموعة" value={supplier.supplier_group || '-'} />
        <MetricCard detail="بلد المورد" icon={MapPinned} label="الدولة" tone="amber" value={supplier.country || '-'} />
      </section>

      <div className="detail-layout">
        <section className="detail-panel">
          <h4>بيانات العمل</h4>
          <FieldLine label="المجموعة" value={supplier.supplier_group} />
          <FieldLine label="الدولة" value={supplier.country} />
          <FieldLine label="العملة الافتراضية" value={supplier.default_currency} />
          <FieldLine label="شروط الدفع" value={supplier.payment_terms} />
          <FieldLine label="الرقم الضريبي" value={supplier.tax_id} />
          <FieldLine label="المالك" value={supplier.owner} />
          <FieldLine label="تاريخ الإنشاء" value={formatDateTime(supplier.creation)} />
          <FieldLine label="آخر تعديل" value={formatDateTime(supplier.modified)} />
        </section>

        <section className="detail-panel">
          <h4>التواصل</h4>
          <FieldLine label="الهاتف" value={supplier.mobile_no} />
          <FieldLine label="البريد" value={supplier.email_id} />
          <FieldLine label="الموقع" value={supplier.website} />
          <FieldLine label="العنوان الرئيسي" value={supplier.supplier_primary_address ?? supplier.primary_address ?? supplier.address} />
          <FieldLine label="الملاحظات" value={supplier.supplier_details} />
        </section>
      </div>

      <section className="related-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">سجلات مرتبطة من السيرفر</p>
            <h4>المستندات المرتبطة</h4>
          </div>
        </div>
        <SupplierRelatedPanel supplierName={supplier.name} />
      </section>
    </>
  )
}

import { ArrowLeft, BadgeCheck, Boxes, DollarSign, Edit, Package, Power, Scale } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Badge } from '@/shared/ui/badge'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { ItemRelatedPanel } from '../components/item-related-panel'
import { ItemStatusBadge } from '../components/item-status-badge'
import { ItemStockBadge } from '../components/item-stock-badge'
import { useItem } from '../hooks/use-item'
import { canUsePermission, useItemPermissions } from '../hooks/use-item-permissions'
import { useSetItemDisabled } from '../hooks/use-set-item-disabled'

function FieldLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="detail-line">
      <span>{label}</span>
      <strong>{value || '-'}</strong>
    </div>
  )
}

export default function ItemDetailsPage() {
  const { itemId } = useParams()
  const permissions = useItemPermissions()
  const itemQuery = useItem(itemId)
  const setDisabledMutation = useSetItemDisabled()

  if (!itemId) {
    return <Navigate replace to="/items" />
  }

  if (itemQuery.isLoading) {
    return <Loading />
  }

  if (itemQuery.isError) {
    return <ErrorState message={(itemQuery.error as Error).message} />
  }

  if (!itemQuery.data) {
    return <ErrorState message="لم يتم العثور على الصنف." />
  }

  const item = itemQuery.data

  return (
    <>
      <Breadcrumbs items={[{ label: 'المنتجات', to: '/items' }, { label: item.item_code }]} />
      <PageHeader
        actions={
          <>
            <Link className="button button-secondary" to="/items">
              <ArrowLeft size={17} aria-hidden="true" />
              رجوع
            </Link>
            {canUsePermission(permissions.canWrite) ? (
              <Link className="button button-secondary" to={`/items/${encodeURIComponent(item.name)}/edit`}>
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
                    name: item.name,
                    disabled: item.disabled !== 1,
                  })
                }}
              >
                <Power size={17} aria-hidden="true" />
                {item.disabled ? 'تفعيل' : 'تعطيل'}
              </button>
            ) : null}
          </>
        }
        eyebrow="نوع المستند: الصنف"
        meta={
          <>
            <ItemStockBadge item={item} />
            <ItemStatusBadge item={item} />
          </>
        }
        subtitle={`معرّف ERPNext: ${item.name}`}
        title={item.item_code}
      />

      {setDisabledMutation.isError ? <ErrorState message={(setDisabledMutation.error as Error).message} /> : null}

      <section className="detail-summary">
        <div className="summary-main">
          <div className="summary-icon">
            <Package size={26} aria-hidden="true" />
          </div>
          <div>
            <h3>{item.item_name || item.item_code}</h3>
            <p>{item.item_group} | {item.stock_uom}</p>
          </div>
        </div>
        <div className="summary-badges">
          <ItemStockBadge item={item} />
          <ItemStatusBadge item={item} />
          <Badge tone="neutral">بيانات أساسية</Badge>
        </div>
      </section>

      <section className="metrics-grid compact" aria-label="مؤشرات الصنف">
        <MetricCard detail="مجموعة الصنف في ERPNext" icon={Boxes} label="المجموعة" tone="blue" value={item.item_group || '-'} />
        <MetricCard detail="وحدة القياس الافتراضية" icon={Scale} label="وحدة القياس" value={item.stock_uom || '-'} />
        <MetricCard detail="سعر البيع القياسي" icon={DollarSign} label="سعر البيع" tone="amber" value={formatMoney(item.standard_rate)} />
      </section>

      <div className="detail-layout">
        <section className="detail-panel">
          <h4>بيانات العمل</h4>
          <FieldLine label="كود الصنف" value={item.item_code} />
          <FieldLine label="اسم الصنف" value={item.item_name} />
          <FieldLine label="مجموعة الصنف" value={item.item_group} />
          <FieldLine label="العلامة التجارية" value={item.brand} />
          <FieldLine label="المالك" value={item.owner} />
          <FieldLine label="تاريخ الإنشاء" value={formatDateTime(item.creation)} />
          <FieldLine label="آخر تعديل" value={formatDateTime(item.modified)} />
        </section>

        <section className="detail-panel">
          <h4>خيارات ERP والأسعار</h4>
          <FieldLine label="تتبع المخزون" value={item.is_stock_item === 0 ? 'لا' : 'نعم'} />
          <FieldLine label="السماح بالبيع" value={item.is_sales_item === 0 ? 'لا' : 'نعم'} />
          <FieldLine label="السماح بالشراء" value={item.is_purchase_item === 0 ? 'لا' : 'نعم'} />
          <FieldLine label="له متغيرات" value={item.has_variants === 1 ? 'نعم' : 'لا'} />
          <FieldLine label="سعر التقييم" value={formatMoney(item.valuation_rate)} />
          <FieldLine label="الوصف" value={item.description} />
        </section>
      </div>

      <section className="related-section">
        <div className="section-heading split">
          <div>
            <p className="eyebrow">سجلات مرتبطة من السيرفر</p>
            <h4>بيانات المخزون والأسعار المرتبطة</h4>
          </div>
          <Badge tone="blue">
            <BadgeCheck size={14} aria-hidden="true" />
            بيانات مباشرة من ERPNext
          </Badge>
        </div>
        <ItemRelatedPanel itemCode={item.item_code} />
      </section>
    </>
  )
}

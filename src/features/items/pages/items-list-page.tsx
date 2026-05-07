import { Boxes, PackageCheck, PackageX, Plus, Search, Tags } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLinkOptions } from '@/shared/hooks/use-link-options'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { EmptyState } from '@/shared/ui/empty-state'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { ItemsTable } from '../components/items-table'
import { canUsePermission, useItemPermissions } from '../hooks/use-item-permissions'
import { useItemSummary, useItems } from '../hooks/use-items'

const PAGE_SIZE = 20

export default function ItemsListPage() {
  const permissions = useItemPermissions()
  const itemGroupOptions = useLinkOptions('Item Group')
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const [itemGroup, setItemGroup] = useState('all')
  const [stockMode, setStockMode] = useState<'stock' | 'non-stock' | 'all'>('all')
  const [status, setStatus] = useState<'active' | 'disabled' | 'all'>('all')
  const [page, setPage] = useState(0)
  const offset = page * PAGE_SIZE

  const { data, isLoading, isError, error } = useItems({
    search,
    itemGroup,
    stockMode,
    status,
    limit: PAGE_SIZE,
    offset,
  })
  const summaryQuery = useItemSummary({ search, itemGroup, stockMode, status })

  const rows = useMemo(() => data?.rows ?? [], [data])
  const summary = summaryQuery.data
  const summaryFallback = summaryQuery.isError || !summary
  const totalCount = summary?.totalCount ?? rows.length
  const activeCount = summary?.activeCount ?? rows.filter((item) => item.disabled !== 1).length
  const stockCount = summary?.stockCount ?? rows.filter((item) => item.is_stock_item !== 0).length
  const disabledCount = summary?.disabledCount ?? rows.filter((item) => item.disabled === 1).length

  function resetPaging() {
    setPage(0)
  }

  function syncSearchQuery(value: string) {
    const nextParams = new URLSearchParams(searchParams)

    if (value.trim()) {
      nextParams.set('q', value)
    } else {
      nextParams.delete('q')
    }

    setSearchParams(nextParams, { replace: true })
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'المنتجات' }]} />
      <PageHeader
        actions={
          canUsePermission(permissions.canCreate) ? (
            <Link className="button button-primary" to="/items/new">
              <Plus size={17} aria-hidden="true" />
              إنشاء صنف
            </Link>
          ) : null
        }
        eyebrow="نوع المستند: الصنف"
        meta={
          <span>{summaryFallback ? `عرض ${rows.length} سجل من الصفحة الحالية` : `إجمالي النتائج الحالية: ${totalCount}`}</span>
        }
        subtitle="إدارة سجلات الأصناف المستخدمة في المبيعات والمشتريات والمخزون."
        title="المنتجات"
      />

      <section className="metrics-grid" aria-label="ملخص الأصناف">
        <MetricCard
          detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'}
          icon={Boxes}
          label="السجلات"
          tone="blue"
          value={totalCount}
        />
        <MetricCard
          detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'}
          icon={PackageCheck}
          label="النشطة"
          tone="green"
          value={activeCount}
        />
        <MetricCard
          detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'}
          icon={Tags}
          label="أصناف مخزنية"
          tone="amber"
          value={stockCount}
        />
        <MetricCard
          detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'}
          icon={PackageX}
          label="المعطلة"
          tone="red"
          value={disabledCount}
        />
      </section>

      <section className="toolbar" aria-label="فلاتر الأصناف">
        <label className="search-box">
          <Search size={17} aria-hidden="true" />
          <input
            placeholder="ابحث بكود الصنف أو الاسم"
            value={search}
            onChange={(event) => {
              const nextValue = event.target.value
              syncSearchQuery(nextValue)
              resetPaging()
            }}
          />
        </label>

        <label className="filter-field">
          <span>المجموعة</span>
          <select
            value={itemGroup}
            onChange={(event) => {
              setItemGroup(event.target.value)
              resetPaging()
            }}
          >
            <option value="all">الكل</option>
            {(itemGroupOptions.data ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>النوع</span>
          <select
            value={stockMode}
            onChange={(event) => {
              setStockMode(event.target.value as 'stock' | 'non-stock' | 'all')
              resetPaging()
            }}
          >
            <option value="all">الكل</option>
            <option value="stock">مخزني</option>
            <option value="non-stock">غير مخزني</option>
          </select>
        </label>

        <label className="filter-field">
          <span>الحالة</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as 'active' | 'disabled' | 'all')
              resetPaging()
            }}
          >
            <option value="all">الكل</option>
            <option value="active">نشط</option>
            <option value="disabled">معطل</option>
          </select>
        </label>
      </section>

      {isLoading ? <Loading /> : null}
      {isError ? <ErrorState message={(error as Error).message} /> : null}
      {!isLoading && !isError && rows.length === 0 ? (
        <EmptyState
          action={
            canUsePermission(permissions.canCreate) ? (
              <Link className="button button-primary" to="/items/new">
                <Plus size={17} aria-hidden="true" />
                إنشاء صنف
              </Link>
            ) : null
          }
          message="جرّب تعديل الفلاتر أو أنشئ أول سجل صنف."
          title="لا توجد أصناف."
        />
      ) : null}
      {!isLoading && !isError && rows.length > 0 ? <ItemsTable permissions={permissions} rows={rows} /> : null}

      <div className="pagination-bar">
        <button className="button button-secondary" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>
          السابق
        </button>
        <span>صفحة {page + 1}</span>
        <button
          className="button button-secondary"
          disabled={!data?.hasNextPage}
          onClick={() => setPage((current) => current + 1)}
        >
          التالي
        </button>
      </div>
    </>
  )
}

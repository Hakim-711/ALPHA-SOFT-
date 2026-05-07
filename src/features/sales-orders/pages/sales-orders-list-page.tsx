import { CircleDollarSign, Clock3, FileText, Plus, Search, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLinkOptions } from '@/shared/hooks/use-link-options'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { EmptyState } from '@/shared/ui/empty-state'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { canUsePermission, useSalesOrderPermissions } from '../hooks/use-sales-order-permissions'
import { useSalesOrderSummary, useSalesOrders } from '../hooks/use-sales-orders'
import { SalesOrdersTable } from '../components/sales-orders-table'

const PAGE_SIZE = 20

export default function SalesOrdersListPage() {
  const permissions = useSalesOrderPermissions()
  const companyOptions = useLinkOptions('Company')
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const [lifecycle, setLifecycle] = useState<'draft' | 'submitted' | 'cancelled' | 'all'>('all')
  const [company, setCompany] = useState('all')
  const [page, setPage] = useState(0)
  const offset = page * PAGE_SIZE

  const { data, isLoading, isError, error } = useSalesOrders({
    search,
    lifecycle,
    company,
    limit: PAGE_SIZE,
    offset,
  })
  const summaryQuery = useSalesOrderSummary({ search, lifecycle, company })

  const rows = useMemo(() => data?.rows ?? [], [data])
  const summary = summaryQuery.data
  const summaryFallback = summaryQuery.isError || !summary
  const totalCount = summary?.totalCount ?? rows.length
  const draftCount = summary?.draftCount ?? rows.filter((order) => order.docstatus === 0).length
  const submittedCount = summary?.submittedCount ?? rows.filter((order) => order.docstatus === 1).length
  const cancelledCount = summary?.cancelledCount ?? rows.filter((order) => order.docstatus === 2).length
  const currentPageValue = rows.reduce((sum, order) => sum + (order.grand_total ?? 0), 0)

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
      <Breadcrumbs items={[{ label: 'أوامر البيع' }]} />
      <PageHeader
        actions={
          canUsePermission(permissions.canCreate) ? (
            <Link className="button button-primary" to="/sales-orders/new">
              <Plus size={17} aria-hidden="true" />
              إنشاء أمر بيع
            </Link>
          ) : null
        }
        eyebrow="نوع المستند: أمر بيع"
        meta={
          <span>{summaryFallback ? `عرض ${rows.length} سجل من الصفحة الحالية` : `إجمالي النتائج الحالية: ${totalCount}`}</span>
        }
        subtitle="إدارة أوامر البيع المرتبطة بالعملاء والأصناف والإجماليات داخل ERPNext."
        title="أوامر البيع"
      />

      <section className="metrics-grid" aria-label="ملخص أوامر البيع">
        <MetricCard
          detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'}
          icon={ShoppingCart}
          label="السجلات"
          tone="blue"
          value={totalCount}
        />
        <MetricCard
          detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'}
          icon={Clock3}
          label="المسودات"
          tone="amber"
          value={draftCount}
        />
        <MetricCard
          detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'}
          icon={FileText}
          label="المعتمدة"
          tone="green"
          value={submittedCount}
        />
        <MetricCard detail="إجمالي الصفحة الحالية" icon={CircleDollarSign} label="القيمة" tone="red" value={currentPageValue.toFixed(2)} />
      </section>

      <section className="toolbar" aria-label="فلاتر أوامر البيع">
        <label className="search-box">
          <Search size={17} aria-hidden="true" />
          <input
            placeholder="ابحث برقم الطلب أو العميل"
            value={search}
            onChange={(event) => {
              const nextValue = event.target.value
              syncSearchQuery(nextValue)
              resetPaging()
            }}
          />
        </label>

        <label className="filter-field">
          <span>الدورة</span>
          <select
            value={lifecycle}
            onChange={(event) => {
              setLifecycle(event.target.value as 'draft' | 'submitted' | 'cancelled' | 'all')
              resetPaging()
            }}
          >
            <option value="all">الكل</option>
            <option value="draft">مسودة</option>
            <option value="submitted">معتمد</option>
            <option value="cancelled">ملغي</option>
          </select>
        </label>

        <label className="filter-field">
          <span>الشركة</span>
          <select
            value={company}
            onChange={(event) => {
              setCompany(event.target.value)
              resetPaging()
            }}
          >
            <option value="all">الكل</option>
            {(companyOptions.data ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </section>

      {!summaryFallback && cancelledCount > 0 ? (
        <div className="inline-alert inline-alert-warning" role="status">
          <span>يوجد {cancelledCount} مستند ملغي ضمن النتائج الحالية.</span>
        </div>
      ) : null}

      {isLoading ? <Loading /> : null}
      {isError ? <ErrorState message={(error as Error).message} /> : null}
      {!isLoading && !isError && rows.length === 0 ? (
        <EmptyState
          action={
            canUsePermission(permissions.canCreate) ? (
              <Link className="button button-primary" to="/sales-orders/new">
                <Plus size={17} aria-hidden="true" />
                إنشاء أمر بيع
              </Link>
            ) : null
          }
          message="جرّب تعديل الفلاتر أو أنشئ أول أمر بيع."
          title="لا توجد أوامر بيع."
        />
      ) : null}
      {!isLoading && !isError && rows.length > 0 ? <SalesOrdersTable permissions={permissions} rows={rows} /> : null}

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

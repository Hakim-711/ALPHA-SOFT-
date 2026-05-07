import { CircleDollarSign, Clock3, HandCoins, Plus, Search, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLinkOptions } from '@/shared/hooks/use-link-options'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { EmptyState } from '@/shared/ui/empty-state'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { formatMoney } from '@/shared/utils/format'
import { canUsePermission } from '@/features/permissions/hooks/use-doctype-permissions'
import { useCollectionPermissions } from '../hooks/use-collection-permissions'
import { useCollectionSummary, useCollections } from '../hooks/use-collections'
import { CollectionsTable } from '../components/collections-table'

const PAGE_SIZE = 20

export default function CollectionsListPage() {
  const permissions = useCollectionPermissions()
  const companyOptions = useLinkOptions('Company')
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const [lifecycle, setLifecycle] = useState<'draft' | 'submitted' | 'cancelled' | 'all'>('all')
  const [company, setCompany] = useState('all')
  const [page, setPage] = useState(0)
  const offset = page * PAGE_SIZE
  const collectionsQuery = useCollections({
    search,
    lifecycle,
    company,
    limit: PAGE_SIZE,
    offset,
  })
  const summaryQuery = useCollectionSummary({ search, lifecycle, company })

  const rows = useMemo(() => collectionsQuery.data?.rows ?? [], [collectionsQuery.data])
  const summary = summaryQuery.data
  const summaryFallback = summaryQuery.isError || !summary
  const totalCount = summary?.totalCount ?? rows.length
  const submittedCount = summary?.submittedCount ?? rows.filter((row) => row.docstatus === 1).length
  const draftCount = summary?.draftCount ?? rows.filter((row) => row.docstatus === 0).length
  const cancelledCount = summary?.cancelledCount ?? rows.filter((row) => row.docstatus === 2).length
  const receivedTotal = rows.reduce((sum, row) => sum + (row.received_amount ?? 0), 0)
  const unallocatedTotal = rows.reduce((sum, row) => sum + (row.unallocated_amount ?? 0), 0)

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
      <Breadcrumbs items={[{ label: 'التحصيلات' }]} />
      <PageHeader
        actions={
          canUsePermission(permissions.canCreate) ? (
            <Link className="button button-primary" to="/collections/new">
              <Plus size={17} aria-hidden="true" />
              إنشاء سند قبض
            </Link>
          ) : null
        }
        eyebrow="المبيعات / التحصيلات"
        meta={
          <span>{summaryFallback ? `عرض ${rows.length} سند من الصفحة الحالية` : `إجمالي النتائج الحالية: ${totalCount}`}</span>
        }
        subtitle="سندات قبض مبسطة فوق Payment Entry لالتقاط التحصيلات اليومية والدفعات المقدمة مع الحفاظ على الذمم والمراجع."
        title="التحصيلات"
      />

      <section className="metrics-grid" aria-label="ملخص التحصيلات">
        <MetricCard
          detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'}
          icon={HandCoins}
          label="السندات"
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
          icon={Wallet}
          label="المعتمدة"
          tone="green"
          value={submittedCount}
        />
        <MetricCard detail="إجمالي الداخل إلى الحسابات" icon={CircleDollarSign} label="المبالغ" tone="red" value={formatMoney(receivedTotal)} />
      </section>

      <section className="toolbar" aria-label="فلاتر التحصيلات">
        <label className="search-box">
          <Search size={17} aria-hidden="true" />
          <input
            placeholder="ابحث برقم السند أو العميل أو المرجع"
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
          <span>يوجد {cancelledCount} سند ملغي ضمن النتائج الحالية.</span>
        </div>
      ) : null}

      {collectionsQuery.isLoading ? <Loading /> : null}
      {collectionsQuery.isError ? <ErrorState message={(collectionsQuery.error as Error).message} /> : null}
      {!collectionsQuery.isLoading && !collectionsQuery.isError && rows.length === 0 ? (
        <EmptyState
          action={
            canUsePermission(permissions.canCreate) ? (
              <Link className="button button-primary" to="/collections/new">
                <Plus size={17} aria-hidden="true" />
                إنشاء سند قبض
              </Link>
            ) : null
          }
          message="غيّر الفلاتر أو أنشئ أول سند قبض لتحريك الذمم والتحصيلات."
          title="لا توجد سندات قبض."
        />
      ) : null}
      {!collectionsQuery.isLoading && !collectionsQuery.isError && rows.length > 0 ? (
        <>
          <CollectionsTable permissions={permissions} rows={rows} />
          <div className="pagination-bar">
            <span>غير مخصص في الصفحة: {formatMoney(unallocatedTotal)}</span>
            <button className="button button-secondary" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>
              السابق
            </button>
            <span>صفحة {page + 1}</span>
            <button
              className="button button-secondary"
              disabled={!collectionsQuery.data?.hasNextPage}
              onClick={() => setPage((current) => current + 1)}
            >
              التالي
            </button>
          </div>
        </>
      ) : null}
    </>
  )
}

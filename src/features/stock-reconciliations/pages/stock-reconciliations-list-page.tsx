import { ClipboardCheck, Clock3, FileCheck2, Plus, Scale, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLinkOptions } from '@/shared/hooks/use-link-options'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { EmptyState } from '@/shared/ui/empty-state'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { StockReconciliationsTable } from '../components/stock-reconciliations-table'
import { canUsePermission, useStockReconciliationPermissions } from '../hooks/use-stock-reconciliation-permissions'
import { useStockReconciliationSummary, useStockReconciliations } from '../hooks/use-stock-reconciliations'
import type { StockReconciliationPurpose } from '../types/stock-reconciliation.types'

const PAGE_SIZE = 20

export default function StockReconciliationsListPage() {
  const permissions = useStockReconciliationPermissions()
  const companyOptions = useLinkOptions('Company')
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const [lifecycle, setLifecycle] = useState<'draft' | 'submitted' | 'cancelled' | 'all'>('all')
  const [company, setCompany] = useState('all')
  const [purpose, setPurpose] = useState<StockReconciliationPurpose | 'all'>('all')
  const [page, setPage] = useState(0)
  const offset = page * PAGE_SIZE
  const documentsQuery = useStockReconciliations({ search, lifecycle, company, purpose, limit: PAGE_SIZE, offset })
  const summaryQuery = useStockReconciliationSummary({ search, lifecycle, company, purpose })

  const rows = useMemo(() => documentsQuery.data?.rows ?? [], [documentsQuery.data])
  const summary = summaryQuery.data
  const summaryFallback = summaryQuery.isError || !summary
  const totalCount = summary?.totalCount ?? rows.length
  const draftCount = summary?.draftCount ?? rows.filter((row) => row.docstatus === 0).length
  const submittedCount = summary?.submittedCount ?? rows.filter((row) => row.docstatus === 1).length
  const openingCount = summary?.openingCount ?? rows.filter((row) => row.purpose === 'Opening Stock').length

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
      <Breadcrumbs items={[{ label: 'الجرد والتسوية' }]} />
      <PageHeader
        actions={
          canUsePermission(permissions.canCreate) ? (
            <Link className="button button-primary" to="/stock-reconciliations/new">
              <Plus size={17} aria-hidden="true" />
              إنشاء جرد جديد
            </Link>
          ) : null
        }
        eyebrow="نوع المستند: جرد وتسوية"
        meta={<span>{summaryFallback ? `عرض ${rows.length} مستند من الصفحة الحالية` : `إجمالي النتائج الحالية: ${totalCount}`}</span>}
        subtitle="إدارة تسويات المخزون والجرد الافتتاحي مباشرة فوق Stock Reconciliation مع الحفاظ على أثر ERPNext المحاسبي والمخزني."
        title="الجرد والتسوية"
      />

      <section className="metrics-grid" aria-label="ملخص الجرد والتسوية">
        <MetricCard detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'} icon={ClipboardCheck} label="المستندات" tone="blue" value={totalCount} />
        <MetricCard detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'} icon={Clock3} label="المسودات" tone="amber" value={draftCount} />
        <MetricCard detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'} icon={FileCheck2} label="المعتمدة" tone="green" value={submittedCount} />
        <MetricCard detail="عدد مستندات الرصيد الافتتاحي" icon={Scale} label="افتتاحي" tone="neutral" value={openingCount} />
      </section>

      <section className="toolbar" aria-label="فلاتر الجرد والتسوية">
        <label className="search-box">
          <Search size={17} aria-hidden="true" />
          <input
            placeholder="ابحث برقم المستند أو الشركة أو الحساب"
            value={search}
            onChange={(event) => {
              syncSearchQuery(event.target.value)
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

        <label className="filter-field">
          <span>الغرض</span>
          <select
            value={purpose}
            onChange={(event) => {
              setPurpose(event.target.value as StockReconciliationPurpose | 'all')
              resetPaging()
            }}
          >
            <option value="all">الكل</option>
            <option value="Opening Stock">رصيد افتتاحي</option>
            <option value="Stock Reconciliation">تسوية مخزون</option>
          </select>
        </label>
      </section>

      {documentsQuery.isLoading ? <Loading /> : null}
      {documentsQuery.isError ? <ErrorState message={(documentsQuery.error as Error).message} /> : null}
      {!documentsQuery.isLoading && !documentsQuery.isError && rows.length === 0 ? (
        <EmptyState
          action={
            canUsePermission(permissions.canCreate) ? (
              <Link className="button button-primary" to="/stock-reconciliations/new">
                <Plus size={17} aria-hidden="true" />
                إنشاء جرد جديد
              </Link>
            ) : null
          }
          message="ابدأ بجرد افتتاحي أو تسوية فعلية حتى نستطيع تتبع فروقات المخزون من الواجهة."
          title="لا توجد مستندات جرد أو تسوية."
        />
      ) : null}
      {!documentsQuery.isLoading && !documentsQuery.isError && rows.length > 0 ? (
        <>
          <StockReconciliationsTable permissions={permissions} rows={rows} />
          <div className="pagination-bar">
            <button className="button button-secondary" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>
              السابق
            </button>
            <span>صفحة {page + 1}</span>
            <button
              className="button button-secondary"
              disabled={!documentsQuery.data?.hasNextPage}
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

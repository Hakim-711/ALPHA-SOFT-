import { Boxes, Clock3, FileCheck2, Plus, Search, Wallet } from 'lucide-react'
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
import { StockEntriesTable } from '../components/stock-entries-table'
import { StockLedgerTable } from '../components/stock-ledger-table'
import { canUsePermission, useStockPermissions } from '../hooks/use-stock-permissions'
import { useStockEntryLedger } from '../hooks/use-stock-entry-ledger'
import { useStockDefaults } from '../hooks/use-stock-defaults'
import { useStockEntries, useStockEntrySummary } from '../hooks/use-stock-entries'
import type { StockEntryPurpose } from '../types/stock.types'

const PAGE_SIZE = 20

export default function StockListPage() {
  const permissions = useStockPermissions()
  const defaultsQuery = useStockDefaults()
  const companyOptions = useLinkOptions('Company')
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const [lifecycle, setLifecycle] = useState<'draft' | 'submitted' | 'cancelled' | 'all'>('all')
  const [company, setCompany] = useState('all')
  const [purpose, setPurpose] = useState<StockEntryPurpose | 'all'>('all')
  const [page, setPage] = useState(0)
  const offset = page * PAGE_SIZE
  const stockEntriesQuery = useStockEntries({ search, lifecycle, company, purpose, limit: PAGE_SIZE, offset })
  const summaryQuery = useStockEntrySummary({ search, lifecycle, company, purpose })
  const recentLedgerQuery = useStockEntryLedger()

  const rows = useMemo(() => stockEntriesQuery.data?.rows ?? [], [stockEntriesQuery.data])
  const recentLedger = recentLedgerQuery.data ?? []
  const summary = summaryQuery.data
  const summaryFallback = summaryQuery.isError || !summary
  const totalCount = summary?.totalCount ?? rows.length
  const draftCount = summary?.draftCount ?? rows.filter((row) => row.docstatus === 0).length
  const submittedCount = summary?.submittedCount ?? rows.filter((row) => row.docstatus === 1).length
  const cancelledCount = summary?.cancelledCount ?? rows.filter((row) => row.docstatus === 2).length
  const pageValue = rows.reduce((sum, row) => sum + (row.total_incoming_value ?? 0) + (row.total_outgoing_value ?? 0), 0)

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
      <Breadcrumbs items={[{ label: 'حركات المخزون' }]} />
      <PageHeader
        actions={
          canUsePermission(permissions.canCreate) ? (
            <Link className="button button-primary" to="/stock/new">
              <Plus size={17} aria-hidden="true" />
              إنشاء حركة مخزون
            </Link>
          ) : null
        }
        eyebrow="نوع المستند: حركة مخزون"
        meta={<span>{summaryFallback ? `عرض ${rows.length} حركة من الصفحة الحالية` : `إجمالي النتائج الحالية: ${totalCount}`}</span>}
        subtitle="إدارة استلام وصرف وتحويل المواد مباشرة فوق Stock Entry مع عرض آخر الحركات الدفترية من ERPNext."
        title="حركات المخزون"
      />

      <section className="metrics-grid" aria-label="ملخص حركات المخزون">
        <MetricCard detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'} icon={Boxes} label="الحركات" tone="blue" value={totalCount} />
        <MetricCard detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'} icon={Clock3} label="المسودات" tone="amber" value={draftCount} />
        <MetricCard detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'} icon={FileCheck2} label="المعتمدة" tone="green" value={submittedCount} />
        <MetricCard detail="إجمالي قيمة الحركات في الصفحة الحالية" icon={Wallet} label="القيمة" tone="red" value={formatMoney(pageValue)} />
      </section>

      <section className="toolbar" aria-label="فلاتر حركات المخزون">
        <label className="search-box">
          <Search size={17} aria-hidden="true" />
          <input
            placeholder="ابحث برقم الحركة أو النوع أو المستودع"
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
          <span>النوع</span>
          <select
            value={purpose}
            onChange={(event) => {
              setPurpose(event.target.value as StockEntryPurpose | 'all')
              resetPaging()
            }}
          >
            <option value="all">الكل</option>
            {(defaultsQuery.data?.stockEntryTypes ?? []).map((type) => (
              <option key={type.name} value={type.purpose}>
                {type.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {!summaryFallback && cancelledCount > 0 ? (
        <div className="inline-alert inline-alert-warning" role="status">
          <span>يوجد {cancelledCount} حركة مخزون ملغاة ضمن النتائج الحالية.</span>
        </div>
      ) : null}

      {stockEntriesQuery.isLoading ? <Loading /> : null}
      {stockEntriesQuery.isError ? <ErrorState message={(stockEntriesQuery.error as Error).message} /> : null}
      {!stockEntriesQuery.isLoading && !stockEntriesQuery.isError && rows.length === 0 ? (
        <EmptyState
          action={
            canUsePermission(permissions.canCreate) ? (
              <Link className="button button-primary" to="/stock/new">
                <Plus size={17} aria-hidden="true" />
                إنشاء حركة مخزون
              </Link>
            ) : null
          }
          message="أنشئ أول حركة استلام أو صرف أو تحويل لبدء تشغيل دورة المخزون من الواجهة."
          title="لا توجد حركات مخزون."
        />
      ) : null}
      {!stockEntriesQuery.isLoading && !stockEntriesQuery.isError && rows.length > 0 ? (
        <>
          <StockEntriesTable permissions={permissions} rows={rows} />
          <div className="pagination-bar">
            <button className="button button-secondary" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>
              السابق
            </button>
            <span>صفحة {page + 1}</span>
            <button
              className="button button-secondary"
              disabled={!stockEntriesQuery.data?.hasNextPage}
              onClick={() => setPage((current) => current + 1)}
            >
              التالي
            </button>
          </div>
        </>
      ) : null}

      <section className="related-section">
        <div className="section-heading">
          <h4>آخر الحركات الدفترية للمخزون</h4>
          <p>هذا القسم يعرض آخر السطور المسجلة في `Stock Ledger Entry` حتى لو لم تكن قد أنشأت حركة Stock Entry من هذه الواجهة بعد.</p>
        </div>
        {recentLedgerQuery.isLoading ? <Loading /> : null}
        {recentLedgerQuery.isError ? <ErrorState message={(recentLedgerQuery.error as Error).message} /> : null}
        {!recentLedgerQuery.isLoading && !recentLedgerQuery.isError && recentLedger.length > 0 ? <StockLedgerTable rows={recentLedger} /> : null}
        {!recentLedgerQuery.isLoading && !recentLedgerQuery.isError && recentLedger.length === 0 ? (
          <div className="inline-alert inline-alert-warning" role="status">
            <span>لا توجد حركات دفترية مخزنية معروضة حاليًا.</span>
          </div>
        ) : null}
      </section>
    </>
  )
}

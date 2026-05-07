import { CircleDollarSign, Clock3, MinusCircle, Plus, Search, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { EmptyState } from '@/shared/ui/empty-state'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { formatMoney } from '@/shared/utils/format'
import { canUsePermission } from '@/features/permissions/hooks/use-doctype-permissions'
import { useLinkOptions } from '@/shared/hooks/use-link-options'
import { DisbursementsTable } from '../components/disbursements-table'
import { useDisbursementPermissions } from '../hooks/use-disbursement-permissions'
import { useDisbursementSummary, useDisbursements } from '../hooks/use-disbursements'

const PAGE_SIZE = 20

export default function DisbursementsListPage() {
  const permissions = useDisbursementPermissions()
  const companyOptions = useLinkOptions('Company')
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const [lifecycle, setLifecycle] = useState<'draft' | 'submitted' | 'cancelled' | 'all'>('all')
  const [company, setCompany] = useState('all')
  const [page, setPage] = useState(0)
  const offset = page * PAGE_SIZE
  const disbursementsQuery = useDisbursements({
    search,
    lifecycle,
    company,
    limit: PAGE_SIZE,
    offset,
  })
  const summaryQuery = useDisbursementSummary({ search, lifecycle, company })

  const rows = useMemo(() => disbursementsQuery.data?.rows ?? [], [disbursementsQuery.data])
  const summary = summaryQuery.data
  const summaryFallback = summaryQuery.isError || !summary
  const totalCount = summary?.totalCount ?? rows.length
  const submittedCount = summary?.submittedCount ?? rows.filter((row) => row.docstatus === 1).length
  const draftCount = summary?.draftCount ?? rows.filter((row) => row.docstatus === 0).length
  const cancelledCount = summary?.cancelledCount ?? rows.filter((row) => row.docstatus === 2).length
  const paidTotal = rows.reduce((sum, row) => sum + (row.paid_amount ?? 0), 0)
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
      <Breadcrumbs items={[{ label: 'سندات الصرف' }]} />
      <PageHeader
        actions={
          canUsePermission(permissions.canCreate) ? (
            <Link className="button button-primary" to="/disbursements/new">
              <Plus size={17} aria-hidden="true" />
              إنشاء سند صرف
            </Link>
          ) : null
        }
        eyebrow="المالية / سندات الصرف"
        meta={<span>{summaryFallback ? `عرض ${rows.length} سند من الصفحة الحالية` : `إجمالي النتائج الحالية: ${totalCount}`}</span>}
        subtitle="سندات صرف مبسطة فوق Payment Entry لتسجيل دفعات الموردين والتسويات والدفعات المقدمة بدون كسر منطق ERPNext."
        title="سندات الصرف"
      />

      <section className="metrics-grid" aria-label="ملخص سندات الصرف">
        <MetricCard
          detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'}
          icon={Wallet}
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
          icon={MinusCircle}
          label="المعتمدة"
          tone="green"
          value={submittedCount}
        />
        <MetricCard detail="إجمالي الخارج من الحسابات" icon={CircleDollarSign} label="المدفوع" tone="red" value={formatMoney(paidTotal)} />
      </section>

      <section className="toolbar" aria-label="فلاتر سندات الصرف">
        <label className="search-box">
          <Search size={17} aria-hidden="true" />
          <input
            placeholder="ابحث برقم السند أو المورد أو المرجع"
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

      {disbursementsQuery.isLoading ? <Loading /> : null}
      {disbursementsQuery.isError ? <ErrorState message={(disbursementsQuery.error as Error).message} /> : null}
      {!disbursementsQuery.isLoading && !disbursementsQuery.isError && rows.length === 0 ? (
        <EmptyState
          action={
            canUsePermission(permissions.canCreate) ? (
              <Link className="button button-primary" to="/disbursements/new">
                <Plus size={17} aria-hidden="true" />
                إنشاء سند صرف
              </Link>
            ) : null
          }
          message="غير الفلاتر أو أنشئ أول سند صرف لتبدأ تتبع دفعات الموردين والتسويات."
          title="لا توجد سندات صرف."
        />
      ) : null}
      {!disbursementsQuery.isLoading && !disbursementsQuery.isError && rows.length > 0 ? (
        <>
          <DisbursementsTable permissions={permissions} rows={rows} />
          <div className="pagination-bar">
            <span>غير مخصص في الصفحة: {formatMoney(unallocatedTotal)}</span>
            <button className="button button-secondary" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>
              السابق
            </button>
            <span>صفحة {page + 1}</span>
            <button
              className="button button-secondary"
              disabled={!disbursementsQuery.data?.hasNextPage}
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

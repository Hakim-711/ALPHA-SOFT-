import { CircleDollarSign, Clock3, FileCheck2, Plus, Search, Wallet } from 'lucide-react'
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
import { canUsePermission, usePurchaseInvoicePermissions } from '../hooks/use-purchase-invoice-permissions'
import { usePurchaseInvoiceSummary, usePurchaseInvoices } from '../hooks/use-purchase-invoices'
import { PurchaseInvoicesTable } from '../components/purchase-invoices-table'

const PAGE_SIZE = 20

export default function PurchaseInvoicesListPage() {
  const permissions = usePurchaseInvoicePermissions()
  const companyOptions = useLinkOptions('Company')
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const [lifecycle, setLifecycle] = useState<'draft' | 'submitted' | 'cancelled' | 'all'>('all')
  const [company, setCompany] = useState('all')
  const [page, setPage] = useState(0)
  const offset = page * PAGE_SIZE
  const invoicesQuery = usePurchaseInvoices({
    search,
    lifecycle,
    company,
    limit: PAGE_SIZE,
    offset,
  })
  const summaryQuery = usePurchaseInvoiceSummary({ search, lifecycle, company })

  const rows = useMemo(() => invoicesQuery.data?.rows ?? [], [invoicesQuery.data])
  const summary = summaryQuery.data
  const summaryFallback = summaryQuery.isError || !summary
  const totalCount = summary?.totalCount ?? rows.length
  const draftCount = summary?.draftCount ?? rows.filter((row) => row.docstatus === 0).length
  const submittedCount = summary?.submittedCount ?? rows.filter((row) => row.docstatus === 1).length
  const cancelledCount = summary?.cancelledCount ?? rows.filter((row) => row.docstatus === 2).length
  const outstandingTotal = rows.reduce((sum, row) => sum + (row.outstanding_amount ?? 0), 0)

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
      <Breadcrumbs items={[{ label: 'فواتير الشراء' }]} />
      <PageHeader
        actions={
          canUsePermission(permissions.canCreate) ? (
            <Link className="button button-primary" to="/purchase-invoices/new">
              <Plus size={17} aria-hidden="true" />
              إنشاء فاتورة شراء
            </Link>
          ) : null
        }
        eyebrow="نوع المستند: فاتورة شراء"
        meta={<span>{summaryFallback ? `عرض ${rows.length} فاتورة من الصفحة الحالية` : `إجمالي النتائج الحالية: ${totalCount}`}</span>}
        subtitle="إدارة فواتير الشراء وربطها بالدائنين والمخزون ودفعات الموردين داخل ERPNext."
        title="فواتير الشراء"
      />

      <section className="metrics-grid" aria-label="ملخص فواتير الشراء">
        <MetricCard detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'} icon={Wallet} label="الفواتير" tone="blue" value={totalCount} />
        <MetricCard detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'} icon={Clock3} label="المسودات" tone="amber" value={draftCount} />
        <MetricCard detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'} icon={FileCheck2} label="المعتمدة" tone="green" value={submittedCount} />
        <MetricCard detail="المستحق في الصفحة الحالية" icon={CircleDollarSign} label="الدائنون" tone="red" value={formatMoney(outstandingTotal)} />
      </section>

      <section className="toolbar" aria-label="فلاتر فواتير الشراء">
        <label className="search-box">
          <Search size={17} aria-hidden="true" />
          <input
            placeholder="ابحث برقم الفاتورة أو المورد"
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
          <span>يوجد {cancelledCount} فاتورة ملغاة ضمن النتائج الحالية.</span>
        </div>
      ) : null}

      {invoicesQuery.isLoading ? <Loading /> : null}
      {invoicesQuery.isError ? <ErrorState message={(invoicesQuery.error as Error).message} /> : null}
      {!invoicesQuery.isLoading && !invoicesQuery.isError && rows.length === 0 ? (
        <EmptyState
          action={
            canUsePermission(permissions.canCreate) ? (
              <Link className="button button-primary" to="/purchase-invoices/new">
                <Plus size={17} aria-hidden="true" />
                إنشاء فاتورة شراء
              </Link>
            ) : null
          }
          message="جرّب تعديل الفلاتر أو أنشئ أول فاتورة شراء."
          title="لا توجد فواتير شراء."
        />
      ) : null}
      {!invoicesQuery.isLoading && !invoicesQuery.isError && rows.length > 0 ? (
        <>
          <PurchaseInvoicesTable permissions={permissions} rows={rows} />
          <div className="pagination-bar">
            <button className="button button-secondary" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>
              السابق
            </button>
            <span>صفحة {page + 1}</span>
            <button
              className="button button-secondary"
              disabled={!invoicesQuery.data?.hasNextPage}
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

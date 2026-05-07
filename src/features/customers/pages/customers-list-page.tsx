import { Building2, Plus, Search, UserCheck, UserX, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { EmptyState } from '@/shared/ui/empty-state'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { CustomersTable } from '../components/customers-table'
import { useCustomerPermissions, canUsePermission } from '../hooks/use-customer-permissions'
import { useCustomerSummary, useCustomers } from '../hooks/use-customers'

const PAGE_SIZE = 20

export default function CustomersListPage() {
  const permissions = useCustomerPermissions()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const [customerType, setCustomerType] = useState('all')
  const [status, setStatus] = useState<'active' | 'disabled' | 'all'>('all')
  const [page, setPage] = useState(0)
  const offset = page * PAGE_SIZE

  const { data, isLoading, isError, error } = useCustomers({
    search,
    customerType,
    status,
    limit: PAGE_SIZE,
    offset,
  })
  const summaryQuery = useCustomerSummary({ search, customerType, status })

  const rows = useMemo(() => data?.rows ?? [], [data])
  const summary = summaryQuery.data
  const summaryFallback = summaryQuery.isError || !summary
  const totalCount = summary?.totalCount ?? rows.length
  const activeCount = summary?.activeCount ?? rows.filter((customer) => customer.disabled !== 1).length
  const disabledCount = summary?.disabledCount ?? rows.filter((customer) => customer.disabled === 1).length
  const companyCount = summary?.companyCount ?? rows.filter((customer) => customer.customer_type === 'Company').length

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
      <Breadcrumbs items={[{ label: 'العملاء' }]} />
      <PageHeader
        actions={
          canUsePermission(permissions.canCreate) ? (
            <Link className="button button-primary" to="/customers/new">
              <Plus size={17} aria-hidden="true" />
              إنشاء عميل
            </Link>
          ) : null
        }
        eyebrow="نوع المستند: العميل"
        meta={
          <span>{summaryFallback ? `عرض ${rows.length} سجل من الصفحة الحالية` : `إجمالي النتائج الحالية: ${totalCount}`}</span>
        }
        subtitle="إدارة عملاء ERPNext من الواجهة المخصصة."
        title="العملاء"
      />

      <section className="metrics-grid" aria-label="ملخص العملاء">
        <MetricCard
          detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'}
          icon={UsersRound}
          label="السجلات"
          tone="blue"
          value={totalCount}
        />
        <MetricCard
          detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'}
          icon={UserCheck}
          label="النشطون"
          tone="green"
          value={activeCount}
        />
        <MetricCard
          detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'}
          icon={UserX}
          label="المعطلون"
          tone="red"
          value={disabledCount}
        />
        <MetricCard
          detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'}
          icon={Building2}
          label="الشركات"
          tone="amber"
          value={companyCount}
        />
      </section>

      <section className="toolbar" aria-label="فلاتر العملاء">
        <label className="search-box">
          <Search size={17} aria-hidden="true" />
          <input
            placeholder="ابحث عن عميل"
            value={search}
            onChange={(event) => {
              const nextValue = event.target.value
              syncSearchQuery(nextValue)
              resetPaging()
            }}
          />
        </label>

        <label className="filter-field">
          <span>النوع</span>
          <select
            value={customerType}
            onChange={(event) => {
              setCustomerType(event.target.value)
              resetPaging()
            }}
          >
            <option value="all">الكل</option>
            <option value="Individual">فرد</option>
            <option value="Company">شركة</option>
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
              <Link className="button button-primary" to="/customers/new">
                <Plus size={17} aria-hidden="true" />
                إنشاء عميل
              </Link>
            ) : null
          }
          message="جرّب تعديل الفلاتر أو أنشئ أول سجل عميل."
          title="لا يوجد عملاء."
        />
      ) : null}
      {!isLoading && !isError && rows.length > 0 ? <CustomersTable permissions={permissions} rows={rows} /> : null}

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

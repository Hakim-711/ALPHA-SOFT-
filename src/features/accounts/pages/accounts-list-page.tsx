import { KeyRound, Plus, Search, ShieldCheck, UserCheck, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { EmptyState } from '@/shared/ui/empty-state'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { AccountsTable } from '../components/accounts-table'
import { canUsePermission, useAccountPermissions } from '../hooks/use-account-permissions'
import { useAccountSummary, useAccounts } from '../hooks/use-accounts'

const PAGE_SIZE = 20

export default function AccountsListPage() {
  const permissions = useAccountPermissions()
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const [userType, setUserType] = useState<'System User' | 'Website User' | 'all'>('all')
  const [status, setStatus] = useState<'active' | 'disabled' | 'all'>('all')
  const [page, setPage] = useState(0)
  const offset = page * PAGE_SIZE
  const canReadAccounts = canUsePermission(permissions.canRead)

  const { data, isLoading, isError, error } = useAccounts({
    search,
    userType,
    status,
    limit: PAGE_SIZE,
    offset,
    enabled: canReadAccounts,
  })
  const summaryQuery = useAccountSummary({ search, userType, status, enabled: canReadAccounts })

  const rows = useMemo(() => data?.rows ?? [], [data])
  const summary = summaryQuery.data
  const summaryFallback = summaryQuery.isError || !summary
  const totalCount = summary?.totalCount ?? rows.length
  const activeCount = summary?.activeCount ?? rows.filter((row) => row.enabled !== 0).length
  const systemCount = summary?.systemCount ?? rows.filter((row) => row.user_type !== 'Website User').length
  const websiteCount = summary?.websiteCount ?? rows.filter((row) => row.user_type === 'Website User').length

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
      <Breadcrumbs items={[{ label: 'الحسابات والصلاحيات' }]} />
      <PageHeader
        actions={
          canUsePermission(permissions.canCreate) ? (
            <Link className="button button-primary" to="/accounts/new">
              <Plus size={17} aria-hidden="true" />
              إنشاء حساب
            </Link>
          ) : null
        }
        eyebrow="نوع المستند: User"
        meta={<span>{summaryFallback ? `عرض ${rows.length} سجل من الصفحة الحالية` : `إجمالي النتائج الحالية: ${totalCount}`}</span>}
        subtitle="إدارة مستخدمي ERPNext وأدوارهم من واجهة عربية مبسطة تحترم صلاحيات السيرفر."
        title="الحسابات والصلاحيات"
      />

      {permissions.isLoading ? <Loading /> : null}
      {!permissions.isLoading && !canReadAccounts ? (
        <ErrorState message="لا توجد لديك صلاحية قراءة حسابات المستخدمين. راجع مدير النظام أو دور المستخدم داخل ERPNext." />
      ) : null}

      {canReadAccounts ? (
      <section className="metrics-grid" aria-label="ملخص الحسابات">
        <MetricCard
          detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'}
          icon={UsersRound}
          label="الحسابات"
          tone="blue"
          value={totalCount}
        />
        <MetricCard
          detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'مطابق للفلاتر الحالية'}
          icon={UserCheck}
          label="المفعلة"
          tone="green"
          value={activeCount}
        />
        <MetricCard
          detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'حسابات Desk وعمليات'}
          icon={ShieldCheck}
          label="مستخدمو النظام"
          tone="amber"
          value={systemCount}
        />
        <MetricCard
          detail={summaryFallback ? 'الصفحة الحالية مؤقتًا' : 'حسابات موقع أو بوابة'}
          icon={KeyRound}
          label="مستخدمو الموقع"
          tone="red"
          value={websiteCount}
        />
      </section>
      ) : null}

      {canReadAccounts ? (
      <section className="toolbar" aria-label="فلاتر الحسابات">
        <label className="search-box">
          <Search size={17} aria-hidden="true" />
          <input
            placeholder="ابحث بالاسم أو البريد أو اسم المستخدم"
            value={search}
            onChange={(event) => {
              syncSearchQuery(event.target.value)
              resetPaging()
            }}
          />
        </label>

        <label className="filter-field">
          <span>النوع</span>
          <select
            value={userType}
            onChange={(event) => {
              setUserType(event.target.value as 'System User' | 'Website User' | 'all')
              resetPaging()
            }}
          >
            <option value="all">الكل</option>
            <option value="System User">مستخدم نظام</option>
            <option value="Website User">مستخدم موقع</option>
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
            <option value="active">مفعل</option>
            <option value="disabled">معطل</option>
          </select>
        </label>
      </section>
      ) : null}

      {canReadAccounts && isLoading ? <Loading /> : null}
      {canReadAccounts && isError ? <ErrorState message={(error as Error).message} /> : null}
      {canReadAccounts && !isLoading && !isError && rows.length === 0 ? (
        <EmptyState
          action={
            canUsePermission(permissions.canCreate) ? (
              <Link className="button button-primary" to="/accounts/new">
                <Plus size={17} aria-hidden="true" />
                إنشاء حساب
              </Link>
            ) : null
          }
          message="جرّب تعديل الفلاتر أو أنشئ أول حساب جديد مع الأدوار المناسبة."
          title="لا توجد حسابات مطابقة."
        />
      ) : null}
      {canReadAccounts && !isLoading && !isError && rows.length > 0 ? <AccountsTable permissions={permissions} rows={rows} /> : null}

      {canReadAccounts ? (
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
      ) : null}
    </>
  )
}

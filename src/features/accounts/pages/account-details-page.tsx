import { Edit, KeyRound, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { Badge } from '@/shared/ui/badge'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { formatDateTime } from '@/shared/utils/format'
import { AccountStatusBadge } from '../components/account-status-badge'
import { AccountTypeBadge } from '../components/account-type-badge'
import { canUsePermission, useAccountPermissions } from '../hooks/use-account-permissions'
import { useAccount } from '../hooks/use-account'
import { useRoles } from '../hooks/use-roles'

export default function AccountDetailsPage() {
  const { accountId } = useParams()
  const permissions = useAccountPermissions()
  const canReadAccount = canUsePermission(permissions.canRead)
  const accountQuery = useAccount(accountId, { enabled: canReadAccount })
  const rolesQuery = useRoles({ enabled: canReadAccount })

  if (permissions.isLoading || (canReadAccount && accountQuery.isLoading)) {
    return <Loading />
  }

  if (!canReadAccount) {
    return <ErrorState message="لا توجد لديك صلاحية قراءة حسابات المستخدمين في ERPNext." />
  }

  if (accountQuery.isError) {
    return <ErrorState message={(accountQuery.error as Error).message} />
  }

  if (!accountQuery.data) {
    return <ErrorState message="لم يتم العثور على الحساب المطلوب." />
  }

  const account = accountQuery.data
  const assignedRoles = (account.roles ?? []).map((row) => row.role).filter((role): role is string => Boolean(role))
  const deskRoles = new Set((rolesQuery.data ?? []).filter((role) => role.desk_access === 1).map((role) => role.name))
  const deskRoleCount = assignedRoles.filter((role) => deskRoles.has(role)).length

  return (
    <>
      <Breadcrumbs items={[{ label: 'الحسابات والصلاحيات', to: '/accounts' }, { label: account.full_name || account.name }]} />
      <PageHeader
        actions={
          canUsePermission(permissions.canWrite) ? (
            <Link className="button button-secondary" to={`/accounts/${encodeURIComponent(account.name)}/edit`}>
              <Edit size={17} aria-hidden="true" />
              تعديل الحساب
            </Link>
          ) : null
        }
        eyebrow="تفاصيل المستخدم"
        subtitle="عرض مباشر لبيانات مستخدم ERPNext وأدواره المطبقة عليه."
        title={account.full_name || account.name}
      />

      <section className="detail-panel detail-summary">
        <div className="summary-main">
          <div className="summary-icon">
            <UserRound size={22} aria-hidden="true" />
          </div>
          <div>
            <h3>{account.full_name || account.name}</h3>
            <p>{account.email || account.name}</p>
          </div>
        </div>
        <div className="summary-badges">
          <AccountStatusBadge account={account} />
          <AccountTypeBadge account={account} />
          {account.send_welcome_email === 1 ? <Badge tone="amber">ترحيب بالبريد</Badge> : null}
        </div>
      </section>

      <section className="metrics-grid compact" aria-label="ملخص الصلاحيات">
        <MetricCard detail="إجمالي الأدوار المعيّنة" icon={ShieldCheck} label="الأدوار" tone="blue" value={assignedRoles.length} />
        <MetricCard detail="أدوار وصول مكتبي" icon={KeyRound} label="Desk access" tone="green" value={deskRoleCount} />
        <MetricCard detail="آخر تسجيل دخول أو نشاط" icon={Mail} label="آخر ظهور" tone="amber" value={formatDateTime(account.last_active || account.last_login)} />
      </section>

      <section className="detail-layout">
        <article className="detail-panel">
          <h4>بيانات الحساب</h4>
          <div className="detail-line">
            <span>المعرف</span>
            <strong>{account.name}</strong>
          </div>
          <div className="detail-line">
            <span>البريد الإلكتروني</span>
            <strong>{account.email || '-'}</strong>
          </div>
          <div className="detail-line">
            <span>اسم المستخدم</span>
            <strong>{account.username || '-'}</strong>
          </div>
          <div className="detail-line">
            <span>الجوال</span>
            <strong>{account.mobile_no || '-'}</strong>
          </div>
          <div className="detail-line">
            <span>النوع</span>
            <strong>{account.user_type === 'Website User' ? 'مستخدم موقع' : 'مستخدم نظام'}</strong>
          </div>
          <div className="detail-line">
            <span>الحالة</span>
            <strong>{account.enabled === 0 ? 'معطل' : 'مفعل'}</strong>
          </div>
          <div className="detail-line">
            <span>آخر نشاط</span>
            <strong>{formatDateTime(account.last_active)}</strong>
          </div>
          <div className="detail-line">
            <span>آخر دخول</span>
            <strong>{formatDateTime(account.last_login)}</strong>
          </div>
        </article>

        <article className="detail-panel">
          <h4>الأدوار المعيّنة</h4>
          {assignedRoles.length > 0 ? (
            <div className="role-badge-list">
              {assignedRoles.map((role) => (
                <Badge key={role} tone="neutral">
                  {role}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="detail-empty">لا توجد أدوار مسندة لهذا الحساب.</p>
          )}
        </article>
      </section>
    </>
  )
}

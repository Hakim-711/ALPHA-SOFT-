import { useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { PageHeader } from '@/shared/ui/page-header'
import { AccountForm } from '../components/account-form'
import { canUsePermission, useAccountPermissions } from '../hooks/use-account-permissions'
import { useCreateAccount } from '../hooks/use-create-account'
import { useRoles } from '../hooks/use-roles'
import type { AccountFormValues } from '../types/account.types'

export default function AccountCreatePage() {
  const navigate = useNavigate()
  const permissions = useAccountPermissions()
  const mutation = useCreateAccount()
  const canCreateAccount = canUsePermission(permissions.canCreate)
  const rolesQuery = useRoles({ enabled: canCreateAccount })

  async function handleSubmit(values: AccountFormValues) {
    const account = await mutation.mutateAsync(values)
    navigate(`/accounts/${encodeURIComponent(account.name)}`)
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'الحسابات والصلاحيات', to: '/accounts' }, { label: 'إنشاء حساب' }]} />
      <PageHeader
        eyebrow="تهيئة مستخدم جديد"
        subtitle="أنشئ حساب ERPNext جديدًا وحدد له الأدوار التي ستتحكم في ما يراه داخل الواجهة."
        title="إنشاء حساب"
      />

      {rolesQuery.isLoading ? <Loading /> : null}
      {permissions.isLoading ? <Loading /> : null}
      {!permissions.isLoading && !canCreateAccount ? (
        <ErrorState message="لا توجد لديك صلاحية إنشاء حسابات مستخدمين في ERPNext." />
      ) : null}
      {rolesQuery.isError ? <ErrorState message={(rolesQuery.error as Error).message} /> : null}
      {mutation.isError ? <ErrorState message={(mutation.error as Error).message} /> : null}

      {canCreateAccount && !rolesQuery.isLoading && !rolesQuery.isError ? (
        <AccountForm
          isSubmitting={mutation.isPending}
          mode="create"
          roleOptions={rolesQuery.data ?? []}
          onSubmit={handleSubmit}
        />
      ) : null}
    </>
  )
}

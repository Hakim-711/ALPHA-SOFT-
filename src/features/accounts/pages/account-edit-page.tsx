import { useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { PageHeader } from '@/shared/ui/page-header'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { accountToFormValues } from '../api/accounts.api'
import { AccountForm } from '../components/account-form'
import { canUsePermission, useAccountPermissions } from '../hooks/use-account-permissions'
import { useAccount } from '../hooks/use-account'
import { useUpdateAccount } from '../hooks/use-update-account'
import { useRoles } from '../hooks/use-roles'
import type { AccountFormValues } from '../types/account.types'

export default function AccountEditPage() {
  const { accountId } = useParams()
  const navigate = useNavigate()
  const auth = useAuth()
  const permissions = useAccountPermissions()
  const canEditAccount = canUsePermission(permissions.canWrite)
  const accountQuery = useAccount(accountId, { enabled: canEditAccount })
  const rolesQuery = useRoles({ enabled: canEditAccount })
  const mutation = useUpdateAccount()
  const [formError, setFormError] = useState<string | null>(null)

  if (permissions.isLoading || (canEditAccount && (accountQuery.isLoading || rolesQuery.isLoading))) {
    return <Loading />
  }

  if (!canEditAccount) {
    return <ErrorState message="لا توجد لديك صلاحية تعديل حسابات المستخدمين في ERPNext." />
  }

  if (accountQuery.isError) {
    return <ErrorState message={(accountQuery.error as Error).message} />
  }

  if (rolesQuery.isError) {
    return <ErrorState message={(rolesQuery.error as Error).message} />
  }

  if (!accountQuery.data) {
    return <ErrorState message="لم يتم العثور على الحساب المطلوب." />
  }

  async function handleSubmit(values: AccountFormValues) {
    setFormError(null)

    const isSelfAccount = accountQuery.data!.name === auth.user?.name || accountQuery.data!.email === auth.user?.email
    const isAdministratorAccount = accountQuery.data!.name === 'Administrator'
    const currentUserIsSystemManager = auth.user?.roles.includes('System Manager') || auth.user?.name === 'Administrator'

    if ((isSelfAccount || isAdministratorAccount) && !values.enabled) {
      setFormError('لا يمكن تعطيل حسابك الحالي أو حساب Administrator من هذه الواجهة حتى لا يتم قفل النظام.')
      return
    }

    if (isSelfAccount && currentUserIsSystemManager && !values.roles.includes('System Manager')) {
      setFormError('لا يمكن إزالة دور System Manager من حسابك الحالي عبر نفس الجلسة. استخدم مدير نظام آخر لهذا التغيير.')
      return
    }

    await mutation.mutateAsync({
      name: accountQuery.data!.name,
      values,
    })

    navigate(`/accounts/${encodeURIComponent(accountQuery.data!.name)}`)
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'الحسابات والصلاحيات', to: '/accounts' },
          { label: accountQuery.data.full_name || accountQuery.data.name, to: `/accounts/${encodeURIComponent(accountQuery.data.name)}` },
          { label: 'تعديل' },
        ]}
      />
      <PageHeader
        eyebrow="تعديل مستخدم"
        subtitle="حدّث بيانات الحساب أو أدواره مع الحفاظ على منطق الصلاحيات داخل ERPNext."
        title={`تعديل ${accountQuery.data.full_name || accountQuery.data.name}`}
      />

      {formError ? <ErrorState message={formError} /> : null}
      {mutation.isError ? <ErrorState message={(mutation.error as Error).message} /> : null}

      <AccountForm
        initialValues={accountToFormValues(accountQuery.data)}
        isSubmitting={mutation.isPending}
        mode="edit"
        roleOptions={rolesQuery.data ?? []}
        onSubmit={handleSubmit}
      />
    </>
  )
}

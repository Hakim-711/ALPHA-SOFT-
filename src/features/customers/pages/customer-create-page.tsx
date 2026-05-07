import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { PageHeader } from '@/shared/ui/page-header'
import { CustomerForm } from '../components/customer-form'
import { useCreateCustomer } from '../hooks/use-create-customer'
import type { CustomerFormValues } from '../types/customer.types'

export default function CustomerCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreateCustomer()

  async function handleSubmit(values: CustomerFormValues) {
    const customer = await mutation.mutateAsync(values)
    navigate(`/customers/${encodeURIComponent(customer.name)}`)
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'العملاء', to: '/customers' }, { label: 'إنشاء' }]} />
      <PageHeader
        actions={
          <Link className="button button-secondary" to="/customers">
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="نوع المستند: العميل"
        meta={<span>ينشئ مستند عميل حقيقي داخل ERPNext</span>}
        subtitle="إضافة سجل عميل جديد في ERPNext."
        title="إنشاء عميل"
      />

      {mutation.isError ? <ErrorState message={(mutation.error as Error).message} /> : null}

      <CustomerForm isSubmitting={mutation.isPending} onSubmit={handleSubmit} />
    </>
  )
}

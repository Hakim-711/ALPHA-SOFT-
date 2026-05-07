import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { PageHeader } from '@/shared/ui/page-header'
import { customerToFormValues } from '../api/customers.api'
import { CustomerForm } from '../components/customer-form'
import { useCustomer } from '../hooks/use-customer'
import { useUpdateCustomer } from '../hooks/use-update-customer'
import type { CustomerFormValues } from '../types/customer.types'

export default function CustomerEditPage() {
  const { customerId } = useParams()
  const navigate = useNavigate()
  const customerQuery = useCustomer(customerId)
  const updateMutation = useUpdateCustomer()

  if (!customerId) {
    return <Navigate replace to="/customers" />
  }

  if (customerQuery.isLoading) {
    return <Loading />
  }

  if (customerQuery.isError) {
    return <ErrorState message={(customerQuery.error as Error).message} />
  }

  if (!customerQuery.data) {
    return <ErrorState message="لم يتم العثور على العميل." />
  }

  async function handleSubmit(values: CustomerFormValues) {
    const customer = customerQuery.data

    if (!customer) {
      return
    }

    await updateMutation.mutateAsync({
      name: customer.name,
      values,
    })

    navigate(`/customers/${encodeURIComponent(customer.name)}`)
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'العملاء', to: '/customers' },
          { label: customerQuery.data.customer_name, to: `/customers/${encodeURIComponent(customerQuery.data.name)}` },
          { label: 'تعديل' },
        ]}
      />
      <PageHeader
        actions={
          <Link className="button button-secondary" to={`/customers/${encodeURIComponent(customerQuery.data.name)}`}>
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="نوع المستند: العميل"
        meta={<span>يحدث بيانات ERPNext بعد التحقق</span>}
        subtitle="تحديث بيانات العميل في ERPNext."
        title={`تعديل ${customerQuery.data.customer_name}`}
      />

      {updateMutation.isError ? <ErrorState message={(updateMutation.error as Error).message} /> : null}

      <CustomerForm
        initialValues={customerToFormValues(customerQuery.data)}
        isSubmitting={updateMutation.isPending}
        onSubmit={handleSubmit}
      />
    </>
  )
}

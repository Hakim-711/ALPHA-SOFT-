import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { PageHeader } from '@/shared/ui/page-header'
import { salesOrderToFormValues } from '../api/sales-orders.api'
import { SalesOrderForm } from '../components/sales-order-form'
import { useSalesOrder } from '../hooks/use-sales-order'
import { useUpdateSalesOrder } from '../hooks/use-update-sales-order'
import type { SalesOrderFormValues } from '../types/sales-order.types'

export default function SalesOrderEditPage() {
  const { salesOrderId } = useParams()
  const navigate = useNavigate()
  const salesOrderQuery = useSalesOrder(salesOrderId)
  const updateMutation = useUpdateSalesOrder()

  if (!salesOrderId) {
    return <Navigate replace to="/sales-orders" />
  }

  if (salesOrderQuery.isLoading) {
    return <Loading />
  }

  if (salesOrderQuery.isError) {
    return <ErrorState message={(salesOrderQuery.error as Error).message} />
  }

  if (!salesOrderQuery.data) {
    return <ErrorState message="لم يتم العثور على أمر البيع." />
  }

  if (salesOrderQuery.data.docstatus !== 0) {
    return <ErrorState message="لا يمكن تعديل أمر بيع معتمد أو ملغي." />
  }

  async function handleSubmit(values: SalesOrderFormValues) {
    const order = salesOrderQuery.data

    if (!order) {
      return
    }

    await updateMutation.mutateAsync({
      name: order.name,
      values,
    })

    navigate(`/sales-orders/${encodeURIComponent(order.name)}`)
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'أوامر البيع', to: '/sales-orders' },
          { label: salesOrderQuery.data.name, to: `/sales-orders/${encodeURIComponent(salesOrderQuery.data.name)}` },
          { label: 'تعديل' },
        ]}
      />
      <PageHeader
        actions={
          <Link className="button button-secondary" to={`/sales-orders/${encodeURIComponent(salesOrderQuery.data.name)}`}>
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="نوع المستند: أمر بيع"
        meta={<span>يحدث بيانات ERPNext بعد التحقق</span>}
        subtitle="تعديل أمر البيع قبل الاعتماد النهائي."
        title={`تعديل ${salesOrderQuery.data.name}`}
      />

      {updateMutation.isError ? <ErrorState message={(updateMutation.error as Error).message} /> : null}

      <SalesOrderForm
        initialValues={salesOrderToFormValues(salesOrderQuery.data)}
        isSubmitting={updateMutation.isPending}
        onSubmit={handleSubmit}
      />
    </>
  )
}

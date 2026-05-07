import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { PageHeader } from '@/shared/ui/page-header'
import { purchaseOrderToFormValues } from '../api/purchase-orders.api'
import { PurchaseOrderForm } from '../components/purchase-order-form'
import { usePurchaseOrder } from '../hooks/use-purchase-order'
import { useUpdatePurchaseOrder } from '../hooks/use-update-purchase-order'
import type { PurchaseOrderFormValues } from '../types/purchase-order.types'

export default function PurchaseOrderEditPage() {
  const { purchaseOrderId } = useParams()
  const navigate = useNavigate()
  const purchaseOrderQuery = usePurchaseOrder(purchaseOrderId)
  const updateMutation = useUpdatePurchaseOrder()

  if (!purchaseOrderId) {
    return <Navigate replace to="/purchase-orders" />
  }

  if (purchaseOrderQuery.isLoading) {
    return <Loading />
  }

  if (purchaseOrderQuery.isError) {
    return <ErrorState message={(purchaseOrderQuery.error as Error).message} />
  }

  if (!purchaseOrderQuery.data) {
    return <ErrorState message="لم يتم العثور على أمر الشراء." />
  }

  if (purchaseOrderQuery.data.docstatus !== 0) {
    return <ErrorState message="لا يمكن تعديل أمر شراء معتمد أو ملغي." />
  }

  async function handleSubmit(values: PurchaseOrderFormValues) {
    const order = purchaseOrderQuery.data

    if (!order) {
      return
    }

    await updateMutation.mutateAsync({
      name: order.name,
      values,
    })

    navigate(`/purchase-orders/${encodeURIComponent(order.name)}`)
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'أوامر الشراء', to: '/purchase-orders' },
          { label: purchaseOrderQuery.data.name, to: `/purchase-orders/${encodeURIComponent(purchaseOrderQuery.data.name)}` },
          { label: 'تعديل' },
        ]}
      />
      <PageHeader
        actions={
          <Link className="button button-secondary" to={`/purchase-orders/${encodeURIComponent(purchaseOrderQuery.data.name)}`}>
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="نوع المستند: أمر شراء"
        meta={<span>يحدث بيانات ERPNext بعد التحقق</span>}
        subtitle="تعديل أمر الشراء قبل الاعتماد النهائي."
        title={`تعديل ${purchaseOrderQuery.data.name}`}
      />

      {updateMutation.isError ? <ErrorState message={(updateMutation.error as Error).message} /> : null}

      <PurchaseOrderForm
        initialValues={purchaseOrderToFormValues(purchaseOrderQuery.data)}
        isSubmitting={updateMutation.isPending}
        onSubmit={handleSubmit}
      />
    </>
  )
}




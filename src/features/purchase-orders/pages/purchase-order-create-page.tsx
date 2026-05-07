import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { PageHeader } from '@/shared/ui/page-header'
import { PurchaseOrderForm } from '../components/purchase-order-form'
import { useCreatePurchaseOrder } from '../hooks/use-create-purchase-order'
import type { PurchaseOrderFormValues } from '../types/purchase-order.types'

export default function PurchaseOrderCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreatePurchaseOrder()

  async function handleSubmit(values: PurchaseOrderFormValues) {
    const order = await mutation.mutateAsync(values)
    navigate(`/purchase-orders/${encodeURIComponent(order.name)}`)
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'أوامر الشراء', to: '/purchase-orders' }, { label: 'إنشاء' }]} />
      <PageHeader
        actions={
          <Link className="button button-secondary" to="/purchase-orders">
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="نوع المستند: أمر شراء"
        meta={<span>ينشئ مستند Purchase Order حقيقي داخل ERPNext</span>}
        subtitle="إضافة أمر شراء جديد مرتبط بمورد وأصناف فعلية من النظام."
        title="إنشاء أمر شراء"
      />

      {mutation.isError ? <ErrorState message={(mutation.error as Error).message} /> : null}

      <PurchaseOrderForm isSubmitting={mutation.isPending} onSubmit={handleSubmit} />
    </>
  )
}



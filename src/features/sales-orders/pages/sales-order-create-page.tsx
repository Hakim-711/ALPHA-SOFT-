import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { PageHeader } from '@/shared/ui/page-header'
import { SalesOrderForm } from '../components/sales-order-form'
import { useCreateSalesOrder } from '../hooks/use-create-sales-order'
import type { SalesOrderFormValues } from '../types/sales-order.types'

export default function SalesOrderCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreateSalesOrder()

  async function handleSubmit(values: SalesOrderFormValues) {
    const order = await mutation.mutateAsync(values)
    navigate(`/sales-orders/${encodeURIComponent(order.name)}`)
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'أوامر البيع', to: '/sales-orders' }, { label: 'إنشاء' }]} />
      <PageHeader
        actions={
          <Link className="button button-secondary" to="/sales-orders">
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="نوع المستند: أمر بيع"
        meta={<span>ينشئ مستند Sales Order حقيقي داخل ERPNext</span>}
        subtitle="إضافة أمر بيع جديد مرتبط بعميل وأصناف فعلية من النظام."
        title="إنشاء أمر بيع"
      />

      {mutation.isError ? <ErrorState message={(mutation.error as Error).message} /> : null}

      <SalesOrderForm isSubmitting={mutation.isPending} onSubmit={handleSubmit} />
    </>
  )
}

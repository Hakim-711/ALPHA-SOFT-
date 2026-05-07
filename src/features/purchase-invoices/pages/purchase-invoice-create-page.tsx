import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { PageHeader } from '@/shared/ui/page-header'
import { PurchaseInvoiceForm } from '../components/purchase-invoice-form'
import { useCreatePurchaseInvoice } from '../hooks/use-create-purchase-invoice'
import type { PurchaseInvoiceFormValues } from '../types/purchase-invoice.types'

export default function PurchaseInvoiceCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreatePurchaseInvoice()

  async function handleSubmit(values: PurchaseInvoiceFormValues) {
    const invoice = await mutation.mutateAsync(values)
    navigate(`/purchase-invoices/${encodeURIComponent(invoice.name)}`)
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'فواتير الشراء', to: '/purchase-invoices' }, { label: 'إنشاء' }]} />
      <PageHeader
        actions={
          <Link className="button button-secondary" to="/purchase-invoices">
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="نوع المستند: فاتورة شراء"
        subtitle="إنشاء فاتورة شراء جديدة وربطها بالمخزون والدائنين مباشرة داخل ERPNext."
        title="إنشاء فاتورة شراء"
      />

      {mutation.isError ? <ErrorState message={(mutation.error as Error).message} /> : null}

      <PurchaseInvoiceForm isSubmitting={mutation.isPending} onSubmit={handleSubmit} />
    </>
  )
}

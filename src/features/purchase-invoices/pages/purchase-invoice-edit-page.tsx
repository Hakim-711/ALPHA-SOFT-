import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { PageHeader } from '@/shared/ui/page-header'
import { purchaseInvoiceToFormValues } from '../api/purchase-invoices.api'
import { PurchaseInvoiceForm } from '../components/purchase-invoice-form'
import { usePurchaseInvoice } from '../hooks/use-purchase-invoice'
import { useUpdatePurchaseInvoice } from '../hooks/use-update-purchase-invoice'
import type { PurchaseInvoiceFormValues } from '../types/purchase-invoice.types'

export default function PurchaseInvoiceEditPage() {
  const { purchaseInvoiceId } = useParams()
  const navigate = useNavigate()
  const purchaseInvoiceQuery = usePurchaseInvoice(purchaseInvoiceId)
  const updateMutation = useUpdatePurchaseInvoice()

  if (!purchaseInvoiceId) {
    return <Navigate replace to="/purchase-invoices" />
  }

  if (purchaseInvoiceQuery.isLoading) {
    return <Loading />
  }

  if (purchaseInvoiceQuery.isError) {
    return <ErrorState message={(purchaseInvoiceQuery.error as Error).message} />
  }

  if (!purchaseInvoiceQuery.data) {
    return <ErrorState message="لم يتم العثور على فاتورة الشراء." />
  }

  if (purchaseInvoiceQuery.data.docstatus !== 0) {
    return <Navigate replace to={`/purchase-invoices/${encodeURIComponent(purchaseInvoiceQuery.data.name)}`} />
  }

  async function handleSubmit(values: PurchaseInvoiceFormValues) {
    await updateMutation.mutateAsync({
      name: purchaseInvoiceQuery.data!.name,
      values,
    })

    navigate(`/purchase-invoices/${encodeURIComponent(purchaseInvoiceQuery.data!.name)}`)
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'فواتير الشراء', to: '/purchase-invoices' },
          { label: purchaseInvoiceQuery.data.name, to: `/purchase-invoices/${encodeURIComponent(purchaseInvoiceQuery.data.name)}` },
          { label: 'تعديل' },
        ]}
      />
      <PageHeader
        actions={
          <Link className="button button-secondary" to={`/purchase-invoices/${encodeURIComponent(purchaseInvoiceQuery.data.name)}`}>
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="نوع المستند: فاتورة شراء"
        subtitle="تعديل فاتورة شراء في وضع المسودة قبل اعتمادها محاسبيًا."
        title={`تعديل ${purchaseInvoiceQuery.data.name}`}
      />

      {updateMutation.isError ? <ErrorState message={(updateMutation.error as Error).message} /> : null}

      <PurchaseInvoiceForm
        initialValues={purchaseInvoiceToFormValues(purchaseInvoiceQuery.data)}
        isSubmitting={updateMutation.isPending}
        onSubmit={handleSubmit}
      />
    </>
  )
}

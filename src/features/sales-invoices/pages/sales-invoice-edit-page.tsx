import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { PageHeader } from '@/shared/ui/page-header'
import { salesInvoiceToFormValues } from '../api/sales-invoices.api'
import { SalesInvoiceForm } from '../components/sales-invoice-form'
import { useSalesInvoice } from '../hooks/use-sales-invoice'
import { useUpdateSalesInvoice } from '../hooks/use-update-sales-invoice'
import type { SalesInvoiceFormValues } from '../types/sales-invoice.types'

export default function SalesInvoiceEditPage() {
  const { salesInvoiceId } = useParams()
  const navigate = useNavigate()
  const salesInvoiceQuery = useSalesInvoice(salesInvoiceId)
  const updateMutation = useUpdateSalesInvoice()

  if (!salesInvoiceId) {
    return <Navigate replace to="/sales-invoices" />
  }

  if (salesInvoiceQuery.isLoading) {
    return <Loading />
  }

  if (salesInvoiceQuery.isError) {
    return <ErrorState message={(salesInvoiceQuery.error as Error).message} />
  }

  if (!salesInvoiceQuery.data) {
    return <ErrorState message="لم يتم العثور على فاتورة البيع." />
  }

  if (salesInvoiceQuery.data.docstatus !== 0) {
    return <ErrorState message="لا يمكن تعديل فاتورة بيع معتمدة أو ملغاة." />
  }

  async function handleSubmit(values: SalesInvoiceFormValues) {
    const invoice = salesInvoiceQuery.data

    if (!invoice) {
      return
    }

    await updateMutation.mutateAsync({
      name: invoice.name,
      values,
    })

    navigate(`/sales-invoices/${encodeURIComponent(invoice.name)}`)
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'فواتير البيع', to: '/sales-invoices' },
          { label: salesInvoiceQuery.data.name, to: `/sales-invoices/${encodeURIComponent(salesInvoiceQuery.data.name)}` },
          { label: 'تعديل' },
        ]}
      />
      <PageHeader
        actions={
          <Link className="button button-secondary" to={`/sales-invoices/${encodeURIComponent(salesInvoiceQuery.data.name)}`}>
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="نوع المستند: فاتورة بيع"
        meta={<span>يحدث بيانات ERPNext بعد التحقق</span>}
        subtitle="تعديل فاتورة البيع قبل الاعتماد النهائي."
        title={`تعديل ${salesInvoiceQuery.data.name}`}
      />

      {updateMutation.isError ? <ErrorState message={(updateMutation.error as Error).message} /> : null}

      <SalesInvoiceForm
        initialValues={salesInvoiceToFormValues(salesInvoiceQuery.data)}
        isSubmitting={updateMutation.isPending}
        onSubmit={handleSubmit}
      />
    </>
  )
}

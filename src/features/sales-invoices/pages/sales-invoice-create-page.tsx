import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { PageHeader } from '@/shared/ui/page-header'
import { SalesInvoiceForm } from '../components/sales-invoice-form'
import { useCreateSalesInvoice } from '../hooks/use-create-sales-invoice'
import type { SalesInvoiceFormValues } from '../types/sales-invoice.types'

export default function SalesInvoiceCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreateSalesInvoice()

  async function handleSubmit(values: SalesInvoiceFormValues) {
    const invoice = await mutation.mutateAsync(values)
    navigate(`/sales-invoices/${encodeURIComponent(invoice.name)}`)
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'فواتير البيع', to: '/sales-invoices' }, { label: 'إنشاء' }]} />
      <PageHeader
        actions={
          <Link className="button button-secondary" to="/sales-invoices">
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="نوع المستند: فاتورة بيع"
        meta={<span>ينشئ مستند Sales Invoice حقيقي داخل ERPNext</span>}
        subtitle="إضافة فاتورة بيع جديدة مرتبطة بعميل وأصناف فعلية من النظام."
        title="إنشاء فاتورة بيع"
      />

      {mutation.isError ? <ErrorState message={(mutation.error as Error).message} /> : null}

      <SalesInvoiceForm isSubmitting={mutation.isPending} onSubmit={handleSubmit} />
    </>
  )
}

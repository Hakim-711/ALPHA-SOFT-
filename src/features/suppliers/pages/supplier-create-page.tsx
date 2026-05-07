import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { PageHeader } from '@/shared/ui/page-header'
import { SupplierForm } from '../components/supplier-form'
import { useCreateSupplier } from '../hooks/use-create-supplier'
import type { SupplierFormValues } from '../types/supplier.types'

export default function SupplierCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreateSupplier()

  async function handleSubmit(values: SupplierFormValues) {
    const supplier = await mutation.mutateAsync(values)
    navigate(`/suppliers/${encodeURIComponent(supplier.name)}`)
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'الموردون', to: '/suppliers' }, { label: 'إنشاء' }]} />
      <PageHeader
        actions={
          <Link className="button button-secondary" to="/suppliers">
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="نوع المستند: المورد"
        meta={<span>ينشئ مستند مورد حقيقي داخل ERPNext</span>}
        subtitle="إضافة سجل مورد جديد في ERPNext."
        title="إنشاء مورد"
      />

      {mutation.isError ? <ErrorState message={(mutation.error as Error).message} /> : null}

      <SupplierForm isSubmitting={mutation.isPending} onSubmit={handleSubmit} />
    </>
  )
}

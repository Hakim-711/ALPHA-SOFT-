import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { PageHeader } from '@/shared/ui/page-header'
import { supplierToFormValues } from '../api/suppliers.api'
import { SupplierForm } from '../components/supplier-form'
import { useSupplier } from '../hooks/use-supplier'
import { useUpdateSupplier } from '../hooks/use-update-supplier'
import type { SupplierFormValues } from '../types/supplier.types'

export default function SupplierEditPage() {
  const { supplierId } = useParams()
  const navigate = useNavigate()
  const supplierQuery = useSupplier(supplierId)
  const updateMutation = useUpdateSupplier()

  if (!supplierId) {
    return <Navigate replace to="/suppliers" />
  }

  if (supplierQuery.isLoading) {
    return <Loading />
  }

  if (supplierQuery.isError) {
    return <ErrorState message={(supplierQuery.error as Error).message} />
  }

  if (!supplierQuery.data) {
    return <ErrorState message="لم يتم العثور على المورد." />
  }

  async function handleSubmit(values: SupplierFormValues) {
    const supplier = supplierQuery.data

    if (!supplier) {
      return
    }

    await updateMutation.mutateAsync({
      name: supplier.name,
      values,
    })

    navigate(`/suppliers/${encodeURIComponent(supplier.name)}`)
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'الموردون', to: '/suppliers' },
          { label: supplierQuery.data.supplier_name, to: `/suppliers/${encodeURIComponent(supplierQuery.data.name)}` },
          { label: 'تعديل' },
        ]}
      />
      <PageHeader
        actions={
          <Link className="button button-secondary" to={`/suppliers/${encodeURIComponent(supplierQuery.data.name)}`}>
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="نوع المستند: المورد"
        meta={<span>يحدث بيانات ERPNext بعد التحقق</span>}
        subtitle="تحديث بيانات المورد في ERPNext."
        title={`تعديل ${supplierQuery.data.supplier_name}`}
      />

      {updateMutation.isError ? <ErrorState message={(updateMutation.error as Error).message} /> : null}

      <SupplierForm
        initialValues={supplierToFormValues(supplierQuery.data)}
        isSubmitting={updateMutation.isPending}
        onSubmit={handleSubmit}
      />
    </>
  )
}

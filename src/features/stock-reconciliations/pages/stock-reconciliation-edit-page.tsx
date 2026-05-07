import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { PageHeader } from '@/shared/ui/page-header'
import { stockReconciliationToFormValues } from '../api/stock-reconciliations.api'
import { StockReconciliationForm } from '../components/stock-reconciliation-form'
import { useStockReconciliation } from '../hooks/use-stock-reconciliation'
import { useUpdateStockReconciliation } from '../hooks/use-update-stock-reconciliation'
import type { StockReconciliationFormValues } from '../types/stock-reconciliation.types'

export default function StockReconciliationEditPage() {
  const { stockReconciliationId } = useParams()
  const navigate = useNavigate()
  const documentQuery = useStockReconciliation(stockReconciliationId)
  const updateMutation = useUpdateStockReconciliation()

  if (!stockReconciliationId) {
    return <Navigate replace to="/stock-reconciliations" />
  }

  if (documentQuery.isLoading) {
    return <Loading />
  }

  if (documentQuery.isError) {
    return <ErrorState message={(documentQuery.error as Error).message} />
  }

  if (!documentQuery.data) {
    return <ErrorState message="لم يتم العثور على مستند الجرد." />
  }

  if (documentQuery.data.docstatus !== 0) {
    return <Navigate replace to={`/stock-reconciliations/${encodeURIComponent(documentQuery.data.name)}`} />
  }

  async function handleSubmit(values: StockReconciliationFormValues) {
    await updateMutation.mutateAsync({
      name: documentQuery.data!.name,
      values,
    })

    navigate(`/stock-reconciliations/${encodeURIComponent(documentQuery.data!.name)}`)
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'الجرد والتسوية', to: '/stock-reconciliations' },
          { label: documentQuery.data.name, to: `/stock-reconciliations/${encodeURIComponent(documentQuery.data.name)}` },
          { label: 'تعديل' },
        ]}
      />
      <PageHeader
        actions={
          <Link className="button button-secondary" to={`/stock-reconciliations/${encodeURIComponent(documentQuery.data.name)}`}>
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="نوع المستند: جرد وتسوية"
        subtitle="تعديل مستند الجرد ما دام في وضع المسودة قبل اعتماده على المخزون."
        title={`تعديل ${documentQuery.data.name}`}
      />

      {updateMutation.isError ? <ErrorState message={(updateMutation.error as Error).message} /> : null}

      <StockReconciliationForm
        initialValues={stockReconciliationToFormValues(documentQuery.data)}
        isSubmitting={updateMutation.isPending}
        onSubmit={handleSubmit}
      />
    </>
  )
}

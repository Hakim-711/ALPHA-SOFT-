import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { PageHeader } from '@/shared/ui/page-header'
import { stockEntryToFormValues } from '../api/stock.api'
import { StockEntryForm } from '../components/stock-entry-form'
import { useStockEntry } from '../hooks/use-stock-entry'
import { useUpdateStockEntry } from '../hooks/use-update-stock-entry'
import type { StockEntryFormValues } from '../types/stock.types'

export default function StockEditPage() {
  const { stockEntryId } = useParams()
  const navigate = useNavigate()
  const stockEntryQuery = useStockEntry(stockEntryId)
  const updateMutation = useUpdateStockEntry()

  if (!stockEntryId) {
    return <Navigate replace to="/stock" />
  }

  if (stockEntryQuery.isLoading) {
    return <Loading />
  }

  if (stockEntryQuery.isError) {
    return <ErrorState message={(stockEntryQuery.error as Error).message} />
  }

  if (!stockEntryQuery.data) {
    return <ErrorState message="لم يتم العثور على حركة المخزون." />
  }

  if (stockEntryQuery.data.docstatus !== 0) {
    return <Navigate replace to={`/stock/${encodeURIComponent(stockEntryQuery.data.name)}`} />
  }

  async function handleSubmit(values: StockEntryFormValues) {
    await updateMutation.mutateAsync({
      name: stockEntryQuery.data!.name,
      values,
    })

    navigate(`/stock/${encodeURIComponent(stockEntryQuery.data!.name)}`)
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'حركات المخزون', to: '/stock' },
          { label: stockEntryQuery.data.name, to: `/stock/${encodeURIComponent(stockEntryQuery.data.name)}` },
          { label: 'تعديل' },
        ]}
      />
      <PageHeader
        actions={
          <Link className="button button-secondary" to={`/stock/${encodeURIComponent(stockEntryQuery.data.name)}`}>
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="نوع المستند: حركة مخزون"
        subtitle="تعديل حركة المخزون ما دامت في وضع المسودة قبل اعتمادها على دفتر المخزون."
        title={`تعديل ${stockEntryQuery.data.name}`}
      />

      {updateMutation.isError ? <ErrorState message={(updateMutation.error as Error).message} /> : null}

      <StockEntryForm
        initialValues={stockEntryToFormValues(stockEntryQuery.data)}
        isSubmitting={updateMutation.isPending}
        onSubmit={handleSubmit}
      />
    </>
  )
}

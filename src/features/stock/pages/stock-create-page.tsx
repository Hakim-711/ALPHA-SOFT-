import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { PageHeader } from '@/shared/ui/page-header'
import { StockEntryForm } from '../components/stock-entry-form'
import { useCreateStockEntry } from '../hooks/use-create-stock-entry'
import type { StockEntryFormValues } from '../types/stock.types'

export default function StockCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreateStockEntry()

  async function handleSubmit(values: StockEntryFormValues) {
    const entry = await mutation.mutateAsync(values)
    navigate(`/stock/${encodeURIComponent(entry.name)}`)
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'حركات المخزون', to: '/stock' }, { label: 'إنشاء' }]} />
      <PageHeader
        actions={
          <Link className="button button-secondary" to="/stock">
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="نوع المستند: حركة مخزون"
        subtitle="إنشاء حركة استلام أو صرف أو تحويل وكتابتها مباشرة داخل Stock Entry في ERPNext."
        title="إنشاء حركة مخزون"
      />

      {mutation.isError ? <ErrorState message={(mutation.error as Error).message} /> : null}

      <StockEntryForm isSubmitting={mutation.isPending} onSubmit={handleSubmit} />
    </>
  )
}

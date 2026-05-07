import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { PageHeader } from '@/shared/ui/page-header'
import { StockReconciliationForm } from '../components/stock-reconciliation-form'
import { useCreateStockReconciliation } from '../hooks/use-create-stock-reconciliation'
import type { StockReconciliationFormValues } from '../types/stock-reconciliation.types'

export default function StockReconciliationCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreateStockReconciliation()

  async function handleSubmit(values: StockReconciliationFormValues) {
    const document = await mutation.mutateAsync(values)
    navigate(`/stock-reconciliations/${encodeURIComponent(document.name)}`)
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'الجرد والتسوية', to: '/stock-reconciliations' }, { label: 'إنشاء' }]} />
      <PageHeader
        actions={
          <Link className="button button-secondary" to="/stock-reconciliations">
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="نوع المستند: جرد وتسوية"
        subtitle="إنشاء مستند جرد جديد وتحديد الرصيد الصحيح لكل صنف كما تراه فعليًا في المستودع."
        title="إنشاء جرد وتسوية"
      />

      {mutation.isError ? <ErrorState message={(mutation.error as Error).message} /> : null}

      <StockReconciliationForm isSubmitting={mutation.isPending} onSubmit={handleSubmit} />
    </>
  )
}

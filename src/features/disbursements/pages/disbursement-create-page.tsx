import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { PageHeader } from '@/shared/ui/page-header'
import { DisbursementForm } from '../components/disbursement-form'
import { useCreateDisbursement } from '../hooks/use-create-disbursement'
import type { DisbursementFormValues } from '../types/disbursement.types'

export default function DisbursementCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreateDisbursement()

  async function handleSubmit(values: DisbursementFormValues) {
    const disbursement = await mutation.mutateAsync(values)
    navigate(`/disbursements/${encodeURIComponent(disbursement.name)}`)
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'سندات الصرف', to: '/disbursements' }, { label: 'إنشاء' }]} />
      <PageHeader
        actions={
          <Link className="button button-secondary" to="/disbursements">
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="المالية / سندات الصرف"
        subtitle="إنشاء سند صرف جديد لمورد، مع إمكانية ربطه بفواتير شراء مفتوحة أو حفظه كدفعة مقدمة."
        title="إنشاء سند صرف"
      />

      {mutation.isError ? <ErrorState message={(mutation.error as Error).message} /> : null}

      <DisbursementForm isSubmitting={mutation.isPending} onSubmit={handleSubmit} />
    </>
  )
}

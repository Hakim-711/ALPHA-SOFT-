import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { PageHeader } from '@/shared/ui/page-header'
import { disbursementToFormValues } from '../api/disbursements.api'
import { DisbursementForm } from '../components/disbursement-form'
import { useDisbursement } from '../hooks/use-disbursement'
import { useUpdateDisbursement } from '../hooks/use-update-disbursement'
import type { DisbursementFormValues } from '../types/disbursement.types'

export default function DisbursementEditPage() {
  const { disbursementId } = useParams()
  const navigate = useNavigate()
  const disbursementQuery = useDisbursement(disbursementId)
  const updateMutation = useUpdateDisbursement()

  if (!disbursementId) {
    return <Navigate replace to="/disbursements" />
  }

  if (disbursementQuery.isLoading) {
    return <Loading />
  }

  if (disbursementQuery.isError) {
    return <ErrorState message={(disbursementQuery.error as Error).message} />
  }

  if (!disbursementQuery.data) {
    return <ErrorState message="لم يتم العثور على سند الصرف." />
  }

  if (disbursementQuery.data.docstatus !== 0) {
    return <Navigate replace to={`/disbursements/${encodeURIComponent(disbursementQuery.data.name)}`} />
  }

  async function handleSubmit(values: DisbursementFormValues) {
    await updateMutation.mutateAsync({
      name: disbursementQuery.data!.name,
      values,
    })

    navigate(`/disbursements/${encodeURIComponent(disbursementQuery.data!.name)}`)
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'سندات الصرف', to: '/disbursements' },
          { label: disbursementQuery.data.name, to: `/disbursements/${encodeURIComponent(disbursementQuery.data.name)}` },
          { label: 'تعديل' },
        ]}
      />
      <PageHeader
        actions={
          <Link className="button button-secondary" to={`/disbursements/${encodeURIComponent(disbursementQuery.data.name)}`}>
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="المالية / سندات الصرف"
        subtitle="تعديل سند صرف في وضع المسودة قبل اعتماده محاسبيًا."
        title={`تعديل ${disbursementQuery.data.name}`}
      />

      {updateMutation.isError ? <ErrorState message={(updateMutation.error as Error).message} /> : null}

      <DisbursementForm
        initialValues={disbursementToFormValues(disbursementQuery.data)}
        isSubmitting={updateMutation.isPending}
        onSubmit={handleSubmit}
      />
    </>
  )
}

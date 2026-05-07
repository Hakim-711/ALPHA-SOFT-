import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { PageHeader } from '@/shared/ui/page-header'
import { collectionToFormValues } from '../api/collections.api'
import { CollectionForm } from '../components/collection-form'
import { useCollection } from '../hooks/use-collection'
import { useUpdateCollection } from '../hooks/use-update-collection'
import type { CollectionFormValues } from '../types/collection.types'

export default function CollectionEditPage() {
  const { collectionId } = useParams()
  const navigate = useNavigate()
  const collectionQuery = useCollection(collectionId)
  const updateMutation = useUpdateCollection()

  if (!collectionId) {
    return <Navigate replace to="/collections" />
  }

  if (collectionQuery.isLoading) {
    return <Loading />
  }

  if (collectionQuery.isError) {
    return <ErrorState message={(collectionQuery.error as Error).message} />
  }

  if (!collectionQuery.data) {
    return <ErrorState message="لم يتم العثور على سند القبض." />
  }

  if (collectionQuery.data.docstatus !== 0) {
    return <Navigate replace to={`/collections/${encodeURIComponent(collectionQuery.data.name)}`} />
  }

  async function handleSubmit(values: CollectionFormValues) {
    await updateMutation.mutateAsync({
      name: collectionQuery.data!.name,
      values,
    })

    navigate(`/collections/${encodeURIComponent(collectionQuery.data!.name)}`)
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'التحصيلات', to: '/collections' },
          { label: collectionQuery.data.name, to: `/collections/${encodeURIComponent(collectionQuery.data.name)}` },
          { label: 'تعديل' },
        ]}
      />
      <PageHeader
        actions={
          <>
            <Link className="button button-secondary" to={`/collections/${encodeURIComponent(collectionQuery.data.name)}`}>
              <ArrowLeft size={17} aria-hidden="true" />
              رجوع
            </Link>
          </>
        }
        eyebrow="المبيعات / التحصيلات"
        subtitle="تعديل سند قبض في وضع المسودة قبل اعتماده محاسبيًا."
        title={`تعديل ${collectionQuery.data.name}`}
      />

      {updateMutation.isError ? <ErrorState message={(updateMutation.error as Error).message} /> : null}

      <CollectionForm
        initialValues={collectionToFormValues(collectionQuery.data)}
        isSubmitting={updateMutation.isPending}
        onSubmit={handleSubmit}
      />
    </>
  )
}

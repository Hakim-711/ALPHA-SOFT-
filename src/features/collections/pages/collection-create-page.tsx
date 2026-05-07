import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { PageHeader } from '@/shared/ui/page-header'
import { CollectionForm } from '../components/collection-form'
import { useCreateCollection } from '../hooks/use-create-collection'
import type { CollectionFormValues } from '../types/collection.types'

export default function CollectionCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreateCollection()

  async function handleSubmit(values: CollectionFormValues) {
    const collection = await mutation.mutateAsync(values)
    navigate(`/collections/${encodeURIComponent(collection.name)}`)
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'التحصيلات', to: '/collections' }, { label: 'إنشاء' }]} />
      <PageHeader
        actions={
          <Link className="button button-secondary" to="/collections">
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="المبيعات / التحصيلات"
        subtitle="إنشاء سند قبض جديد لعميل، مع إمكانية ربطه بفواتير مفتوحة أو حفظه كدفعة مقدمة."
        title="إنشاء سند قبض"
      />

      {mutation.isError ? <ErrorState message={(mutation.error as Error).message} /> : null}

      <CollectionForm isSubmitting={mutation.isPending} onSubmit={handleSubmit} />
    </>
  )
}

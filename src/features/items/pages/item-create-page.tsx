import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { PageHeader } from '@/shared/ui/page-header'
import { ItemForm } from '../components/item-form'
import { useCreateItem } from '../hooks/use-create-item'
import type { ItemFormValues } from '../types/item.types'

export default function ItemCreatePage() {
  const navigate = useNavigate()
  const mutation = useCreateItem()

  async function handleSubmit(values: ItemFormValues) {
    const item = await mutation.mutateAsync(values)
    navigate(`/items/${encodeURIComponent(item.name)}`)
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'المنتجات', to: '/items' }, { label: 'إنشاء' }]} />
      <PageHeader
        actions={
          <Link className="button button-secondary" to="/items">
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="نوع المستند: الصنف"
        meta={<span>ينشئ مستند صنف حقيقي داخل ERPNext</span>}
        subtitle="إضافة منتج أو خدمة إلى ERPNext."
        title="إنشاء صنف"
      />

      {mutation.isError ? <ErrorState message={(mutation.error as Error).message} /> : null}

      <ItemForm isSubmitting={mutation.isPending} onSubmit={handleSubmit} />
    </>
  )
}

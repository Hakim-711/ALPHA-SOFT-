import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { PageHeader } from '@/shared/ui/page-header'
import { itemToFormValues } from '../api/items.api'
import { ItemForm } from '../components/item-form'
import { useItem } from '../hooks/use-item'
import { useUpdateItem } from '../hooks/use-update-item'
import type { ItemFormValues } from '../types/item.types'

export default function ItemEditPage() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const itemQuery = useItem(itemId)
  const updateMutation = useUpdateItem()

  if (!itemId) {
    return <Navigate replace to="/items" />
  }

  if (itemQuery.isLoading) {
    return <Loading />
  }

  if (itemQuery.isError) {
    return <ErrorState message={(itemQuery.error as Error).message} />
  }

  if (!itemQuery.data) {
    return <ErrorState message="لم يتم العثور على الصنف." />
  }

  async function handleSubmit(values: ItemFormValues) {
    const item = itemQuery.data

    if (!item) {
      return
    }

    await updateMutation.mutateAsync({
      name: item.name,
      values,
    })

    navigate(`/items/${encodeURIComponent(item.name)}`)
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'المنتجات', to: '/items' },
          { label: itemQuery.data.item_code, to: `/items/${encodeURIComponent(itemQuery.data.name)}` },
          { label: 'تعديل' },
        ]}
      />
      <PageHeader
        actions={
          <Link className="button button-secondary" to={`/items/${encodeURIComponent(itemQuery.data.name)}`}>
            <ArrowLeft size={17} aria-hidden="true" />
            رجوع
          </Link>
        }
        eyebrow="نوع المستند: الصنف"
        meta={<span>يحدث بيانات ERPNext بعد التحقق</span>}
        subtitle="تحديث بيانات الصنف في ERPNext."
        title={`تعديل ${itemQuery.data.item_code}`}
      />

      {updateMutation.isError ? <ErrorState message={(updateMutation.error as Error).message} /> : null}

      <ItemForm initialValues={itemToFormValues(itemQuery.data)} isSubmitting={updateMutation.isPending} onSubmit={handleSubmit} />
    </>
  )
}

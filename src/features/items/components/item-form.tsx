import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { LinkDatalistInput } from '@/shared/ui/link-datalist-input'
import { itemSchema, type ItemSchema } from '../schemas/item.schema'
import type { ItemFormValues } from '../types/item.types'

interface ItemFormProps {
  initialValues?: Partial<ItemFormValues>
  isSubmitting?: boolean
  readOnly?: boolean
  onSubmit: (values: ItemFormValues) => void | Promise<void>
}

export function ItemForm({ initialValues, isSubmitting, readOnly = false, onSubmit }: ItemFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ItemSchema>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      item_code: initialValues?.item_code ?? '',
      item_name: initialValues?.item_name ?? '',
      item_group: initialValues?.item_group ?? '',
      stock_uom: initialValues?.stock_uom ?? 'Nos',
      brand: initialValues?.brand ?? '',
      description: initialValues?.description ?? '',
      standard_rate: initialValues?.standard_rate,
      valuation_rate: initialValues?.valuation_rate,
      disabled: initialValues?.disabled ?? false,
      is_stock_item: initialValues?.is_stock_item ?? true,
      is_sales_item: initialValues?.is_sales_item ?? true,
      is_purchase_item: initialValues?.is_purchase_item ?? true,
    },
  })

  const disabled = Boolean(isSubmitting || readOnly)

  return (
    <form className="form-layout" onSubmit={handleSubmit((values) => onSubmit(values))}>
      <div className="form-header">
        <div>
          <p className="eyebrow">بيانات الصنف</p>
          <h3>{initialValues ? 'تعديل صنف' : 'إنشاء صنف'}</h3>
          <p>إدارة بيانات الأصناف في ERPNext المستخدمة في المبيعات والمشتريات والمخزون والتسعير.</p>
        </div>
        <button className="button button-primary" disabled={disabled} type="submit">
          <Save size={17} aria-hidden="true" />
          {isSubmitting ? 'جاري الحفظ' : 'حفظ الصنف'}
        </button>
      </div>

      <div className="form-content">
        <div className="form-main">
          <section className="form-section">
            <div className="section-heading">
              <h4>المعلومات الأساسية</h4>
              <p>المعرّفات والتصنيفات الأساسية المستخدمة في مستندات ERPNext.</p>
            </div>
            <div className="field-grid">
              <label className="field" htmlFor="item_code">
                <span>كود الصنف</span>
                <input id="item_code" aria-invalid={Boolean(errors.item_code)} disabled={disabled} {...register('item_code')} />
                {errors.item_code ? <small>{errors.item_code.message}</small> : null}
              </label>

              <label className="field" htmlFor="item_name">
                <span>اسم الصنف</span>
                <input id="item_name" aria-invalid={Boolean(errors.item_name)} disabled={disabled} {...register('item_name')} />
                {errors.item_name ? <small>{errors.item_name.message}</small> : null}
              </label>

              <label className="field" htmlFor="item_group">
                <span>مجموعة الصنف</span>
                <LinkDatalistInput
                  id="item_group"
                  aria-invalid={Boolean(errors.item_group)}
                  disabled={disabled}
                  doctype="Item Group"
                  errorText={errors.item_group?.message}
                  helperText="رابط مجموعة الصنف في ERPNext"
                  listId="item-group-options"
                  registration={register('item_group')}
                />
              </label>

              <label className="field" htmlFor="stock_uom">
                <span>وحدة القياس الافتراضية</span>
                <LinkDatalistInput
                  id="stock_uom"
                  aria-invalid={Boolean(errors.stock_uom)}
                  disabled={disabled}
                  doctype="UOM"
                  errorText={errors.stock_uom?.message}
                  helperText="رابط وحدة القياس في ERPNext"
                  listId="uom-options"
                  registration={register('stock_uom')}
                />
              </label>

              <label className="field field-wide" htmlFor="brand">
                <span>العلامة التجارية</span>
                <LinkDatalistInput
                  id="brand"
                  disabled={disabled}
                  doctype="Brand"
                  helperText="رابط اختياري للعلامة التجارية في ERPNext"
                  listId="brand-options"
                  registration={register('brand')}
                />
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading">
              <h4>التسعير والتقييم</h4>
              <p>يتم إرسال الأسعار إلى ERPNext وقد تؤثر على تقارير المبيعات وتقييم المخزون.</p>
            </div>
            <div className="field-grid">
              <label className="field" htmlFor="standard_rate">
                <span>سعر البيع القياسي</span>
                <input
                  id="standard_rate"
                  aria-invalid={Boolean(errors.standard_rate)}
                  disabled={disabled}
                  min="0"
                  step="0.01"
                  type="number"
                  {...register('standard_rate', {
                    setValueAs: (value) => (value === '' ? undefined : Number(value)),
                  })}
                />
                {errors.standard_rate ? <small>{errors.standard_rate.message}</small> : null}
              </label>

              <label className="field" htmlFor="valuation_rate">
                <span>سعر التقييم</span>
                <input
                  id="valuation_rate"
                  aria-invalid={Boolean(errors.valuation_rate)}
                  disabled={disabled}
                  min="0"
                  step="0.01"
                  type="number"
                  {...register('valuation_rate', {
                    setValueAs: (value) => (value === '' ? undefined : Number(value)),
                  })}
                />
                {errors.valuation_rate ? <small>{errors.valuation_rate.message}</small> : null}
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading">
              <h4>خيارات التشغيل</h4>
              <p>هذه الخيارات تحدد كيف يسمح ERPNext باستخدام الصنف داخل مستندات الأعمال.</p>
            </div>
            <div className="field-grid">
              <label className="check-field">
                <input disabled={disabled} type="checkbox" {...register('is_stock_item')} />
                <span>تتبع المخزون</span>
              </label>

              <label className="check-field">
                <input disabled={disabled} type="checkbox" {...register('is_sales_item')} />
                <span>السماح بالبيع</span>
              </label>

              <label className="check-field">
                <input disabled={disabled} type="checkbox" {...register('is_purchase_item')} />
                <span>السماح بالشراء</span>
              </label>

              <label className="check-field">
                <input disabled={disabled} type="checkbox" {...register('disabled')} />
                <span>معطل</span>
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading">
              <h4>الوصف</h4>
              <p>مفيد للمستخدمين والمستندات المطبوعة أو التشغيلية اللاحقة.</p>
            </div>
            <label className="field" htmlFor="description">
              <span>الوصف</span>
              <textarea id="description" disabled={disabled} rows={4} {...register('description')} />
            </label>
          </section>
        </div>

        <aside className="form-aside" aria-label="Item rules">
          <p className="eyebrow">قواعد ERP</p>
          <h4>بيانات الصنف تؤثر على العمليات</h4>
          <ul>
            <li>كود الصنف ومجموعة الصنف ووحدة القياس مطلوبة في ERPNext.</li>
            <li>الأصناف المخزنية تؤثر على المستودعات وحركات المخزون.</li>
            <li>الأصناف المعطلة تبقى مرتبطة بالتاريخ ولا يجب استخدامها مجددًا.</li>
          </ul>
        </aside>
      </div>
    </form>
  )
}

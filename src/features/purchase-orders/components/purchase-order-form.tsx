import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownToLine, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { LinkDatalistInput } from '@/shared/ui/link-datalist-input'
import { formatDateInputValue } from '@/shared/utils/date'
import { createEmptyPurchaseOrderItem, getItemPrefill } from '../api/purchase-orders.api'
import { purchaseOrderSchema, type PurchaseOrderSchema } from '../schemas/purchase-order.schema'
import { usePurchaseOrderDefaults } from '../hooks/use-purchase-order-defaults'
import type { PurchaseOrderFormValues } from '../types/purchase-order.types'

interface PurchaseOrderFormProps {
  initialValues?: Partial<PurchaseOrderFormValues>
  isSubmitting?: boolean
  readOnly?: boolean
  onSubmit: (values: PurchaseOrderFormValues) => void | Promise<void>
}

export function PurchaseOrderForm({
  initialValues,
  isSubmitting = false,
  readOnly = false,
  onSubmit,
}: PurchaseOrderFormProps) {
  const defaultsQuery = usePurchaseOrderDefaults()
  const {
    control,
    getValues,
    handleSubmit,
    register,
    setValue,
    formState: { errors },
  } = useForm<PurchaseOrderSchema>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplier: initialValues?.supplier ?? '',
      company: initialValues?.company ?? '',
      transaction_date: initialValues?.transaction_date ?? formatDateInputValue(),
      schedule_date: initialValues?.schedule_date ?? '',
      currency: initialValues?.currency ?? '',
      buying_price_list: initialValues?.buying_price_list ?? '',
      set_warehouse: initialValues?.set_warehouse ?? '',
      items: initialValues?.items?.length ? initialValues.items : [createEmptyPurchaseOrderItem(initialValues?.schedule_date)],
    },
  })
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })
  const items = useWatch({
    control,
    name: 'items',
  }) ?? []
  const orderScheduleDate = useWatch({
    control,
    name: 'schedule_date',
  }) ?? ''
  const orderWarehouse = useWatch({
    control,
    name: 'set_warehouse',
  }) ?? ''
  const provisionalTotal = items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0)
  const disabled = isSubmitting || readOnly

  useEffect(() => {
    if (!defaultsQuery.data) {
      return
    }

    if (!getValues('company') && defaultsQuery.data.companies[0]?.name) {
      setValue('company', defaultsQuery.data.companies[0].name)
    }

    if (!getValues('currency')) {
      const fallbackCurrency = defaultsQuery.data.companies[0]?.default_currency ?? defaultsQuery.data.priceLists[0]?.currency
      if (fallbackCurrency) {
        setValue('currency', fallbackCurrency)
      }
    }

    if (!getValues('buying_price_list') && defaultsQuery.data.priceLists[0]?.name) {
      setValue('buying_price_list', defaultsQuery.data.priceLists[0].name)
    }
  }, [defaultsQuery.data, getValues, setValue])

  async function handleItemLookup(index: number, itemCode: string) {
    const trimmedCode = itemCode.trim()

    if (!trimmedCode || disabled) {
      return
    }

    try {
      const item = await getItemPrefill(trimmedCode)
      setValue(`items.${index}.item_code`, item.item_code)
      setValue(`items.${index}.item_name`, item.item_name)
      setValue(`items.${index}.description`, item.description ?? '')
      setValue(`items.${index}.uom`, item.uom)
      setValue(`items.${index}.stock_uom`, item.stock_uom ?? item.uom)

      if (item.rate !== undefined) {
        setValue(`items.${index}.rate`, item.rate)
      }

      if (!getValues(`items.${index}.warehouse`) && orderWarehouse) {
        setValue(`items.${index}.warehouse`, orderWarehouse)
      }
    } catch {
      return
    }
  }

  function addItemRow() {
    append(createEmptyPurchaseOrderItem(orderScheduleDate))
  }

  return (
    <form className="form-layout" onSubmit={handleSubmit(async (values) => onSubmit(values))}>
      <div className="form-header">
        <div>
          <p className="eyebrow">مستند تشغيلي</p>
          <h3>{initialValues ? 'تعديل أمر شراء' : 'إنشاء أمر شراء'}</h3>
          <p>هذا المستند يربط المورد والأصناف والأسعار مع منطق ERPNext الفعلي في خطوة واحدة.</p>
        </div>
        <button className="button button-primary" disabled={disabled} type="submit">
          <Save size={17} aria-hidden="true" />
          {isSubmitting ? 'جاري الحفظ' : 'حفظ أمر الشراء'}
        </button>
      </div>

      <div className="form-content">
        <div className="form-main">
          <section className="form-section">
            <div className="section-heading">
              <h4>رأس المستند</h4>
              <p>حقول أساسية تتحكم في الشركة والمورد والتاريخ والعملات داخل أمر الشراء.</p>
            </div>
            <div className="field-grid">
              <label className="field" htmlFor="supplier">
                <span>المورد</span>
                <LinkDatalistInput
                  id="supplier"
                  disabled={disabled}
                  doctype="Supplier"
                  errorText={errors.supplier?.message}
                  listId="purchase-order-supplier-options"
                  registration={register('supplier')}
                />
              </label>

              <label className="field" htmlFor="company">
                <span>الشركة</span>
                <LinkDatalistInput
                  id="company"
                  disabled={disabled}
                  doctype="Company"
                  errorText={errors.company?.message}
                  listId="purchase-order-company-options"
                  registration={register('company')}
                />
              </label>

              <label className="field" htmlFor="transaction_date">
                <span>تاريخ الطلب</span>
                <input id="transaction_date" disabled={disabled} type="date" {...register('transaction_date')} />
                {errors.transaction_date ? <small>{errors.transaction_date.message}</small> : null}
              </label>

              <label className="field" htmlFor="schedule_date">
                <span>تاريخ التوريد</span>
                <input id="schedule_date" disabled={disabled} type="date" {...register('schedule_date')} />
              </label>

              <label className="field" htmlFor="currency">
                <span>العملة</span>
                <LinkDatalistInput
                  id="currency"
                  disabled={disabled}
                  doctype="Currency"
                  errorText={errors.currency?.message}
                  listId="purchase-order-currency-options"
                  registration={register('currency')}
                />
              </label>

              <label className="field" htmlFor="buying_price_list">
                <span>قائمة الأسعار</span>
                <LinkDatalistInput
                  id="buying_price_list"
                  disabled={disabled}
                  doctype="Price List"
                  errorText={errors.buying_price_list?.message}
                  listId="purchase-order-price-list-options"
                  registration={register('buying_price_list')}
                />
              </label>

              <label className="field" htmlFor="set_warehouse">
                <span>المستودع الافتراضي</span>
                <LinkDatalistInput
                  id="set_warehouse"
                  disabled={disabled}
                  doctype="Warehouse"
                  listId="purchase-order-warehouse-options"
                  registration={register('set_warehouse')}
                />
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading split">
              <div>
                <h4>أصناف الطلب</h4>
                <p>كل صف يمثل عنصرًا حقيقيًا في جدول `Purchase Order Item` داخل ERPNext.</p>
              </div>
              <button className="button button-secondary" disabled={disabled} type="button" onClick={addItemRow}>
                <Plus size={17} aria-hidden="true" />
                إضافة صنف
              </button>
            </div>

            {typeof errors.items?.message === 'string' ? (
              <div className="inline-alert" role="alert">
                <span>{errors.items.message}</span>
              </div>
            ) : null}

            <div className="line-items-section">
              {fields.map((field, index) => {
                const itemCodeField = register(`items.${index}.item_code`)
                const quantityField = register(`items.${index}.qty`, {
                  setValueAs: (value) => (value === '' ? 1 : Number(value)),
                })
                const rateField = register(`items.${index}.rate`, {
                  setValueAs: (value) => (value === '' ? undefined : Number(value)),
                })

                return (
                  <article className="line-item-card" key={field.id}>
                    <div className="line-item-head">
                      <strong>الصنف {index + 1}</strong>
                      <div className="line-item-controls">
                        <button
                          className="icon-button"
                          disabled={disabled}
                          title="تحميل بيانات الصنف"
                          type="button"
                          onClick={() => {
                            void handleItemLookup(index, getValues(`items.${index}.item_code`))
                          }}
                        >
                          <ArrowDownToLine size={16} aria-hidden="true" />
                          <span className="sr-only">تحميل بيانات الصنف</span>
                        </button>
                        <button
                          className="icon-button"
                          disabled={disabled || fields.length === 1}
                          title="حذف الصف"
                          type="button"
                          onClick={() => remove(index)}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                          <span className="sr-only">حذف الصف</span>
                        </button>
                      </div>
                    </div>

                    <div className="line-item-grid">
                      <label className="field" htmlFor={`items.${index}.item_code`}>
                        <span>كود الصنف</span>
                        <LinkDatalistInput
                          id={`items.${index}.item_code`}
                          disabled={disabled}
                          doctype="Item"
                          errorText={errors.items?.[index]?.item_code?.message}
                          listId={`purchase-order-item-options-${index}`}
                          registration={itemCodeField}
                          onBlur={(event) => {
                            void handleItemLookup(index, event.currentTarget.value)
                          }}
                        />
                      </label>

                      <label className="field" htmlFor={`items.${index}.item_name`}>
                        <span>اسم الصنف</span>
                        <input id={`items.${index}.item_name`} disabled={disabled} {...register(`items.${index}.item_name`)} />
                        {errors.items?.[index]?.item_name ? <small>{errors.items[index]?.item_name?.message}</small> : null}
                      </label>

                      <label className="field" htmlFor={`items.${index}.qty`}>
                        <span>الكمية</span>
                        <input id={`items.${index}.qty`} disabled={disabled} min="0.01" step="0.01" type="number" {...quantityField} />
                        {errors.items?.[index]?.qty ? <small>{errors.items[index]?.qty?.message}</small> : null}
                      </label>

                      <label className="field" htmlFor={`items.${index}.uom`}>
                        <span>وحدة القياس</span>
                        <LinkDatalistInput
                          id={`items.${index}.uom`}
                          disabled={disabled}
                          doctype="UOM"
                          errorText={errors.items?.[index]?.uom?.message}
                          listId={`purchase-order-uom-options-${index}`}
                          registration={register(`items.${index}.uom`)}
                        />
                      </label>

                      <label className="field" htmlFor={`items.${index}.stock_uom`}>
                        <span>وحدة المخزون</span>
                        <input id={`items.${index}.stock_uom`} disabled readOnly {...register(`items.${index}.stock_uom`)} />
                      </label>

                      <label className="field" htmlFor={`items.${index}.rate`}>
                        <span>السعر</span>
                        <input id={`items.${index}.rate`} disabled={disabled} min="0" step="0.01" type="number" {...rateField} />
                        {errors.items?.[index]?.rate ? <small>{errors.items[index]?.rate?.message}</small> : null}
                      </label>

                      <label className="field" htmlFor={`items.${index}.warehouse`}>
                        <span>المستودع</span>
                        <LinkDatalistInput
                          id={`items.${index}.warehouse`}
                          disabled={disabled}
                          doctype="Warehouse"
                          listId={`purchase-order-row-warehouse-options-${index}`}
                          registration={register(`items.${index}.warehouse`)}
                        />
                      </label>

                      <label className="field" htmlFor={`items.${index}.schedule_date`}>
                        <span>تاريخ التوريد</span>
                        <input id={`items.${index}.schedule_date`} disabled={disabled} type="date" {...register(`items.${index}.schedule_date`)} />
                      </label>

                      <label className="field field-wide" htmlFor={`items.${index}.description`}>
                        <span>الوصف</span>
                        <textarea id={`items.${index}.description`} disabled={disabled} rows={2} {...register(`items.${index}.description`)} />
                      </label>
                    </div>

                    <div className="line-item-foot">
                      <span>الإجمالي التقديري للصف</span>
                      <strong>{(((Number(items[index]?.qty) || 0) * (Number(items[index]?.rate) || 0)).toFixed(2))}</strong>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </div>

        <aside className="form-aside" aria-label="ملخص أمر الشراء">
          <p className="eyebrow">ملخص فوري</p>
          <h4>قراءة سريعة قبل الحفظ</h4>
          <ul>
            <li>عدد الأصناف: {items.length}</li>
            <li>الإجمالي التقديري: {provisionalTotal.toFixed(2)}</li>
            <li>ERPNext سيعيد احتساب الإجماليات النهائية بعد الحفظ.</li>
          </ul>
        </aside>
      </div>
    </form>
  )
}



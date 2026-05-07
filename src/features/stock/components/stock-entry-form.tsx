import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownToLine, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { LinkDatalistInput } from '@/shared/ui/link-datalist-input'
import { formatDateInputValue } from '@/shared/utils/date'
import { createEmptyStockEntryItem, getStockEntryItemPrefill } from '../api/stock.api'
import { useStockDefaults } from '../hooks/use-stock-defaults'
import { stockEntrySchema, type StockEntrySchema } from '../schemas/stock.schema'
import type { StockEntryFormValues, StockEntryPurpose, StockEntryTypeOption } from '../types/stock.types'

interface StockEntryFormProps {
  initialValues?: Partial<StockEntryFormValues>
  isSubmitting?: boolean
  readOnly?: boolean
  onSubmit: (values: StockEntryFormValues) => void | Promise<void>
}

function findStockEntryType(types: StockEntryTypeOption[], name?: string) {
  return types.find((type) => type.name === name)
}

function needsSourceWarehouse(purpose?: StockEntryPurpose) {
  return purpose === 'Material Issue' || purpose === 'Material Transfer' || purpose === 'Repack'
}

function needsTargetWarehouse(purpose?: StockEntryPurpose) {
  return purpose === 'Material Receipt' || purpose === 'Material Transfer' || purpose === 'Repack'
}

export function StockEntryForm({ initialValues, isSubmitting = false, readOnly = false, onSubmit }: StockEntryFormProps) {
  const defaultsQuery = useStockDefaults()
  const {
    control,
    getValues,
    handleSubmit,
    register,
    setValue,
    formState: { errors },
  } = useForm<StockEntrySchema>({
    resolver: zodResolver(stockEntrySchema),
    defaultValues: {
      naming_series: initialValues?.naming_series ?? 'MAT-STE-.YYYY.-',
      stock_entry_type: initialValues?.stock_entry_type ?? '',
      purpose: initialValues?.purpose ?? '',
      company: initialValues?.company ?? '',
      posting_date: initialValues?.posting_date ?? formatDateInputValue(),
      posting_time: initialValues?.posting_time ?? new Date().toTimeString().slice(0, 5),
      set_posting_time: initialValues?.set_posting_time ?? true,
      from_warehouse: initialValues?.from_warehouse ?? '',
      to_warehouse: initialValues?.to_warehouse ?? '',
      remarks: initialValues?.remarks ?? '',
      items: initialValues?.items?.length ? initialValues.items : [createEmptyStockEntryItem()],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const watchedItems = useWatch({ control, name: 'items' })
  const stockEntryType = useWatch({ control, name: 'stock_entry_type' }) ?? ''
  const purpose = useWatch({ control, name: 'purpose' }) as StockEntryPurpose | undefined
  const company = useWatch({ control, name: 'company' }) ?? ''
  const fromWarehouse = useWatch({ control, name: 'from_warehouse' }) ?? ''
  const toWarehouse = useWatch({ control, name: 'to_warehouse' }) ?? ''
  const items = watchedItems ?? []
  const defaults = defaultsQuery.data
  const disabled = isSubmitting || readOnly
  const selectedType = useMemo(() => findStockEntryType(defaults?.stockEntryTypes ?? [], stockEntryType), [defaults?.stockEntryTypes, stockEntryType])
  const provisionalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
  const provisionalValue = items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.basic_rate) || 0), 0)

  useEffect(() => {
    if (!defaults) {
      return
    }

    if (!getValues('company') && defaults.companies[0]?.name) {
      setValue('company', defaults.companies[0].name)
    }

    if (!getValues('stock_entry_type') && defaults.stockEntryTypes[0]?.name) {
      setValue('stock_entry_type', defaults.stockEntryTypes[0].name)
      setValue('purpose', defaults.stockEntryTypes[0].purpose)
    }

    if (!getValues('naming_series') && defaults.namingSeriesOptions[0]) {
      setValue('naming_series', defaults.namingSeriesOptions[0])
    }
  }, [defaults, getValues, setValue])

  useEffect(() => {
    if (selectedType && getValues('purpose') !== selectedType.purpose) {
      setValue('purpose', selectedType.purpose)
    }
  }, [getValues, selectedType, setValue])

  async function handleItemLookup(index: number, itemCode: string) {
    const trimmedCode = itemCode.trim()

    if (!trimmedCode || disabled) {
      return
    }

    try {
      const item = await getStockEntryItemPrefill(trimmedCode)
      setValue(`items.${index}.item_code`, item.item_code)
      setValue(`items.${index}.item_name`, item.item_name)
      setValue(`items.${index}.description`, item.description ?? '')
      setValue(`items.${index}.uom`, item.uom)
      setValue(`items.${index}.stock_uom`, item.stock_uom ?? item.uom)
      setValue(`items.${index}.conversion_factor`, item.conversion_factor ?? 1)

      if (item.basic_rate !== undefined) {
        setValue(`items.${index}.basic_rate`, item.basic_rate)
      }

      if (!getValues(`items.${index}.s_warehouse`) && fromWarehouse && needsSourceWarehouse(purpose)) {
        setValue(`items.${index}.s_warehouse`, fromWarehouse)
      }

      if (!getValues(`items.${index}.t_warehouse`) && toWarehouse && needsTargetWarehouse(purpose)) {
        setValue(`items.${index}.t_warehouse`, toWarehouse)
      }
    } catch {
      return
    }
  }

  return (
    <form className="form-layout" onSubmit={handleSubmit(async (values) => onSubmit(values as StockEntryFormValues))}>
      <input type="hidden" {...register('purpose')} />
      <div className="form-header">
        <div>
          <p className="eyebrow">مستند مخزني تشغيلي</p>
          <h3>{initialValues ? 'تعديل حركة مخزون' : 'إنشاء حركة مخزون'}</h3>
          <p>هذه الواجهة تكتب مباشرة إلى `Stock Entry` داخل ERPNext مع الحفاظ على دفتر المخزون، وقيم الحركة، ودورة الاعتماد.</p>
        </div>
        <button className="button button-primary" disabled={disabled} type="submit">
          <Save size={17} aria-hidden="true" />
          {isSubmitting ? 'جاري الحفظ' : 'حفظ الحركة'}
        </button>
      </div>

      <div className="inline-alert" role="status">
        <span>الأنواع المدعومة حاليًا في الواجهة: استلام مواد، صرف مواد، تحويل مواد، وإعادة تعبئة. الأنواع التصنيعية المتقدمة تبقى داخل ERPNext حتى نوسعها بشكل كامل.</span>
      </div>

      <div className="form-content">
        <div className="form-main">
          <section className="form-section">
            <div className="section-heading">
              <h4>رأس الحركة</h4>
              <p>نوع الحركة، الشركة، والتاريخ هي العناصر التي يبني عليها ERPNext الأثر المخزني والقيمي النهائي.</p>
            </div>

            <div className="field-grid">
              <label className="field" htmlFor="stock-entry-type">
                <span>نوع حركة المخزون</span>
                <input id="stock-entry-type" list="stock-entry-type-options" disabled={disabled} {...register('stock_entry_type')} />
                <datalist id="stock-entry-type-options">
                  {(defaults?.stockEntryTypes ?? []).map((type) => (
                    <option key={type.name} value={type.name} />
                  ))}
                </datalist>
                {errors.stock_entry_type ? <small>{errors.stock_entry_type.message}</small> : null}
              </label>

              <label className="field" htmlFor="stock-entry-purpose">
                <span>الغرض</span>
                <input id="stock-entry-purpose" disabled readOnly value={selectedType?.purpose ?? purpose ?? ''} />
              </label>

              <label className="field" htmlFor="stock-entry-company">
                <span>الشركة</span>
                <LinkDatalistInput
                  id="stock-entry-company"
                  disabled={disabled}
                  doctype="Company"
                  errorText={errors.company?.message}
                  listId="stock-entry-company-options"
                  registration={register('company')}
                />
              </label>

              <label className="field" htmlFor="stock-entry-naming-series">
                <span>سلسلة الترقيم</span>
                <select id="stock-entry-naming-series" disabled={disabled} {...register('naming_series')}>
                  {(defaults?.namingSeriesOptions ?? ['MAT-STE-.YYYY.-']).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.naming_series ? <small>{errors.naming_series.message}</small> : null}
              </label>

              <label className="field" htmlFor="stock-entry-posting-date">
                <span>تاريخ القيد</span>
                <input id="stock-entry-posting-date" disabled={disabled} type="date" {...register('posting_date')} />
                {errors.posting_date ? <small>{errors.posting_date.message}</small> : null}
              </label>

              <label className="field" htmlFor="stock-entry-posting-time">
                <span>وقت القيد</span>
                <input id="stock-entry-posting-time" disabled={disabled} type="time" {...register('posting_time')} />
                {errors.posting_time ? <small>{errors.posting_time.message}</small> : null}
              </label>

              <label className="check-field">
                <input disabled={disabled} type="checkbox" {...register('set_posting_time')} />
                <span>تثبيت التاريخ والوقت على الحركة</span>
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading">
              <h4>المسار المخزني</h4>
              <p>يمكنك تحديد مستودعات افتراضية للحركة، ثم ترك الصفوف ترثها تلقائيًا ما لم تحتج إلى استثناءات على مستوى الصنف.</p>
            </div>

            <div className="field-grid">
              <label className="field" htmlFor="stock-entry-from-warehouse">
                <span>المستودع المصدر الافتراضي</span>
                <LinkDatalistInput
                  id="stock-entry-from-warehouse"
                  disabled={disabled}
                  doctype="Warehouse"
                  helperText={needsSourceWarehouse(purpose) ? 'مطلوب لهذا النوع من الحركة ما لم تحدده داخل الصف.' : 'اختياري لهذا النوع من الحركة.'}
                  listId="stock-entry-from-warehouse-options"
                  registration={register('from_warehouse')}
                />
              </label>

              <label className="field" htmlFor="stock-entry-to-warehouse">
                <span>المستودع الهدف الافتراضي</span>
                <LinkDatalistInput
                  id="stock-entry-to-warehouse"
                  disabled={disabled}
                  doctype="Warehouse"
                  helperText={needsTargetWarehouse(purpose) ? 'مطلوب لهذا النوع من الحركة ما لم تحدده داخل الصف.' : 'اختياري لهذا النوع من الحركة.'}
                  listId="stock-entry-to-warehouse-options"
                  registration={register('to_warehouse')}
                />
              </label>

              <label className="field field-wide" htmlFor="stock-entry-remarks">
                <span>ملاحظات</span>
                <textarea id="stock-entry-remarks" disabled={disabled} rows={3} {...register('remarks')} />
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading split">
              <div>
                <h4>أصناف الحركة</h4>
                <p>كل صف هنا يتحول إلى `Stock Entry Detail` داخل ERPNext، وتُعاد حسابات الكميات والقيم على السيرفر بعد الحفظ.</p>
              </div>
              <button className="button button-secondary" disabled={disabled} type="button" onClick={() => append(createEmptyStockEntryItem())}>
                <Plus size={17} aria-hidden="true" />
                إضافة صنف
              </button>
            </div>

            {typeof errors.items?.message === 'string' ? (
              <div className="inline-alert inline-alert-warning" role="alert">
                <span>{errors.items.message}</span>
              </div>
            ) : null}

            <div className="line-items-section">
              {fields.map((field, index) => {
                const itemCodeField = register(`items.${index}.item_code`)
                const quantityField = register(`items.${index}.qty`, {
                  setValueAs: (value) => (value === '' ? 1 : Number(value)),
                })
                const basicRateField = register(`items.${index}.basic_rate`, {
                  setValueAs: (value) => (value === '' ? undefined : Number(value)),
                })
                const conversionFactorField = register(`items.${index}.conversion_factor`, {
                  setValueAs: (value) => (value === '' ? 1 : Number(value)),
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
                      <label className="field" htmlFor={`stock-item-code-${index}`}>
                        <span>كود الصنف</span>
                        <LinkDatalistInput
                          id={`stock-item-code-${index}`}
                          disabled={disabled}
                          doctype="Item"
                          errorText={errors.items?.[index]?.item_code?.message}
                          listId={`stock-item-options-${index}`}
                          registration={itemCodeField}
                          onBlur={(event) => {
                            void handleItemLookup(index, event.currentTarget.value)
                          }}
                        />
                      </label>

                      <label className="field" htmlFor={`stock-item-name-${index}`}>
                        <span>اسم الصنف</span>
                        <input id={`stock-item-name-${index}`} disabled={disabled} {...register(`items.${index}.item_name`)} />
                      </label>

                      <label className="field" htmlFor={`stock-item-qty-${index}`}>
                        <span>الكمية</span>
                        <input id={`stock-item-qty-${index}`} disabled={disabled} min="0.01" step="0.01" type="number" {...quantityField} />
                        {errors.items?.[index]?.qty ? <small>{errors.items[index]?.qty?.message}</small> : null}
                      </label>

                      <label className="field" htmlFor={`stock-item-uom-${index}`}>
                        <span>الوحدة</span>
                        <LinkDatalistInput
                          id={`stock-item-uom-${index}`}
                          disabled={disabled}
                          doctype="UOM"
                          errorText={errors.items?.[index]?.uom?.message}
                          listId={`stock-uom-options-${index}`}
                          registration={register(`items.${index}.uom`)}
                        />
                      </label>

                      <label className="field" htmlFor={`stock-item-stock-uom-${index}`}>
                        <span>وحدة المخزون</span>
                        <input id={`stock-item-stock-uom-${index}`} disabled readOnly {...register(`items.${index}.stock_uom`)} />
                      </label>

                      <label className="field" htmlFor={`stock-item-conversion-factor-${index}`}>
                        <span>معامل التحويل</span>
                        <input
                          id={`stock-item-conversion-factor-${index}`}
                          disabled={disabled}
                          min="0.0001"
                          step="0.0001"
                          type="number"
                          {...conversionFactorField}
                        />
                      </label>

                      <label className="field" htmlFor={`stock-item-basic-rate-${index}`}>
                        <span>السعر الأساسي</span>
                        <input id={`stock-item-basic-rate-${index}`} disabled={disabled} min="0" step="0.01" type="number" {...basicRateField} />
                      </label>

                      <label className="field" htmlFor={`stock-item-source-${index}`}>
                        <span>المستودع المصدر</span>
                        <LinkDatalistInput
                          id={`stock-item-source-${index}`}
                          disabled={disabled}
                          doctype="Warehouse"
                          errorText={errors.items?.[index]?.s_warehouse?.message}
                          listId={`stock-source-warehouse-options-${index}`}
                          registration={register(`items.${index}.s_warehouse`)}
                        />
                      </label>

                      <label className="field" htmlFor={`stock-item-target-${index}`}>
                        <span>المستودع الهدف</span>
                        <LinkDatalistInput
                          id={`stock-item-target-${index}`}
                          disabled={disabled}
                          doctype="Warehouse"
                          errorText={errors.items?.[index]?.t_warehouse?.message}
                          listId={`stock-target-warehouse-options-${index}`}
                          registration={register(`items.${index}.t_warehouse`)}
                        />
                      </label>

                      <label className="field" htmlFor={`stock-item-batch-${index}`}>
                        <span>Batch</span>
                        <LinkDatalistInput
                          id={`stock-item-batch-${index}`}
                          disabled={disabled}
                          doctype="Batch"
                          listId={`stock-batch-options-${index}`}
                          registration={register(`items.${index}.batch_no`)}
                        />
                      </label>

                      <label className="field" htmlFor={`stock-item-serial-${index}`}>
                        <span>Serials</span>
                        <textarea id={`stock-item-serial-${index}`} disabled={disabled} rows={2} {...register(`items.${index}.serial_no`)} />
                      </label>

                      <label className="field field-wide" htmlFor={`stock-item-description-${index}`}>
                        <span>الوصف</span>
                        <textarea id={`stock-item-description-${index}`} disabled={disabled} rows={2} {...register(`items.${index}.description`)} />
                      </label>
                    </div>

                    <div className="line-item-foot">
                      <span>القيمة التقديرية للصف</span>
                      <strong>{((Number(items[index]?.qty) || 0) * (Number(items[index]?.basic_rate) || 0)).toFixed(2)}</strong>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </div>

        <aside className="form-aside" aria-label="ملخص حركة المخزون">
          <p className="eyebrow">ملخص فوري</p>
          <h4>قراءة سريعة قبل الحفظ</h4>
          <ul>
            <li>الشركة: {company || 'غير محددة بعد'}</li>
            <li>الغرض: {selectedType?.purpose || purpose || 'غير محدد بعد'}</li>
            <li>عدد الأصناف: {items.length}</li>
            <li>إجمالي الكمية: {provisionalQty}</li>
            <li>إجمالي القيمة التقديرية: {provisionalValue.toFixed(2)}</li>
            <li>ERPNext سيعيد حساب القيود المخزنية والقيم النهائية بعد الحفظ والاعتماد.</li>
          </ul>
        </aside>
      </div>
    </form>
  )
}

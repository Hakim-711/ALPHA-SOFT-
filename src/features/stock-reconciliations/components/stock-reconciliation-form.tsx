import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownToLine, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { LinkDatalistInput } from '@/shared/ui/link-datalist-input'
import { formatDateInputValue } from '@/shared/utils/date'
import { createEmptyStockReconciliationItem, getStockReconciliationItemPrefill } from '../api/stock-reconciliations.api'
import { useStockReconciliationDefaults } from '../hooks/use-stock-reconciliation-defaults'
import { stockReconciliationSchema, type StockReconciliationSchema } from '../schemas/stock-reconciliation.schema'
import type {
  StockReconciliationCompanyOption,
  StockReconciliationFormValues,
  StockReconciliationPurpose,
} from '../types/stock-reconciliation.types'

interface StockReconciliationFormProps {
  initialValues?: Partial<StockReconciliationFormValues>
  isSubmitting?: boolean
  readOnly?: boolean
  onSubmit: (values: StockReconciliationFormValues) => void | Promise<void>
}

function findCompany(companies: StockReconciliationCompanyOption[], companyName?: string) {
  return companies.find((company) => company.name === companyName)
}

export function StockReconciliationForm({
  initialValues,
  isSubmitting = false,
  readOnly = false,
  onSubmit,
}: StockReconciliationFormProps) {
  const defaultsQuery = useStockReconciliationDefaults()
  const {
    control,
    getValues,
    handleSubmit,
    register,
    setValue,
    formState: { errors },
  } = useForm<StockReconciliationSchema>({
    resolver: zodResolver(stockReconciliationSchema),
    defaultValues: {
      naming_series: initialValues?.naming_series ?? 'MAT-RECO-.YYYY.-',
      company: initialValues?.company ?? '',
      posting_date: initialValues?.posting_date ?? formatDateInputValue(),
      posting_time: initialValues?.posting_time ?? new Date().toTimeString().slice(0, 5),
      purpose: initialValues?.purpose ?? 'Stock Reconciliation',
      set_posting_time: initialValues?.set_posting_time ?? true,
      expense_account: initialValues?.expense_account ?? '',
      cost_center: initialValues?.cost_center ?? '',
      remarks: initialValues?.remarks ?? '',
      items: initialValues?.items?.length ? initialValues.items : [createEmptyStockReconciliationItem()],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const defaults = defaultsQuery.data
  const disabled = isSubmitting || readOnly
  const watchedItems = useWatch({ control, name: 'items' })
  const items = watchedItems ?? []
  const company = useWatch({ control, name: 'company' }) ?? ''
  const purpose = useWatch({ control, name: 'purpose' }) as StockReconciliationPurpose
  const selectedCompany = useMemo(() => findCompany(defaults?.companies ?? [], company), [company, defaults?.companies])
  const totalCurrentAmount = items.reduce((sum, item) => sum + (Number(item.current_amount) || 0), 0)
  const totalAdjustedAmount = items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.valuation_rate) || 0), 0)
  const quantityDelta = items.reduce((sum, item) => sum + ((Number(item.qty) || 0) - (Number(item.current_qty) || 0)), 0)

  useEffect(() => {
    if (!defaults) {
      return
    }

    if (!getValues('company') && defaults.companies[0]?.name) {
      setValue('company', defaults.companies[0].name)
    }

    if (!getValues('naming_series') && defaults.namingSeriesOptions[0]) {
      setValue('naming_series', defaults.namingSeriesOptions[0])
    }
  }, [defaults, getValues, setValue])

  useEffect(() => {
    if (!selectedCompany) {
      return
    }

    if (!getValues('expense_account') && selectedCompany.stock_adjustment_account) {
      setValue('expense_account', selectedCompany.stock_adjustment_account)
    }

    if (!getValues('cost_center') && selectedCompany.cost_center) {
      setValue('cost_center', selectedCompany.cost_center)
    }
  }, [getValues, selectedCompany, setValue])

  async function handleItemLookup(index: number, itemCode: string, warehouse: string) {
    const trimmedCode = itemCode.trim()
    const trimmedWarehouse = warehouse.trim()

    if (!trimmedCode || !trimmedWarehouse || disabled) {
      return
    }

    try {
      const item = await getStockReconciliationItemPrefill(trimmedCode, trimmedWarehouse)
      setValue(`items.${index}.item_code`, item.item_code)
      setValue(`items.${index}.item_name`, item.item_name)
      setValue(`items.${index}.warehouse`, item.warehouse)
      setValue(`items.${index}.current_qty`, item.current_qty ?? 0)
      setValue(`items.${index}.current_valuation_rate`, item.current_valuation_rate)
      setValue(`items.${index}.current_amount`, item.current_amount ?? 0)

      const currentQty = getValues(`items.${index}.qty`)
      const currentRate = getValues(`items.${index}.valuation_rate`)

      if ((currentQty ?? 0) === 0) {
        setValue(`items.${index}.qty`, item.qty ?? 0)
      }

      if (currentRate === undefined) {
        setValue(`items.${index}.valuation_rate`, item.valuation_rate)
      }
    } catch {
      return
    }
  }

  return (
    <form className="form-layout" onSubmit={handleSubmit(async (values) => onSubmit(values as StockReconciliationFormValues))}>
      <div className="form-header">
        <div>
          <p className="eyebrow">مستند جرد وتسوية</p>
          <h3>{initialValues ? 'تعديل جرد المخزون' : 'إنشاء جرد وتسوية'}</h3>
          <p>هذه الواجهة تكتب مباشرة إلى `Stock Reconciliation` داخل ERPNext وتُظهر الرصيد الحالي قبل اعتماد التعديل الفعلي.</p>
        </div>
        <button className="button button-primary" disabled={disabled} type="submit">
          <Save size={17} aria-hidden="true" />
          {isSubmitting ? 'جاري الحفظ' : 'حفظ الجرد'}
        </button>
      </div>

      <div className="form-content">
        <div className="form-main">
          <section className="form-section">
            <div className="section-heading">
              <h4>رأس المستند</h4>
              <p>هنا نحدد الشركة، نوع الجرد، وتاريخ القيد مع حساب فروقات المخزون ومركز التكلفة.</p>
            </div>

            <div className="field-grid">
              <label className="field" htmlFor="stock-reconciliation-series">
                <span>سلسلة الترقيم</span>
                <select id="stock-reconciliation-series" disabled={disabled} {...register('naming_series')}>
                  {(defaults?.namingSeriesOptions ?? ['MAT-RECO-.YYYY.-']).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field" htmlFor="stock-reconciliation-company">
                <span>الشركة</span>
                <LinkDatalistInput
                  id="stock-reconciliation-company"
                  disabled={disabled}
                  doctype="Company"
                  errorText={errors.company?.message}
                  listId="stock-reconciliation-company-options"
                  registration={register('company')}
                />
              </label>

              <label className="field" htmlFor="stock-reconciliation-purpose">
                <span>الغرض</span>
                <select id="stock-reconciliation-purpose" disabled={disabled} {...register('purpose')}>
                  {(defaults?.purposeOptions ?? ['Opening Stock', 'Stock Reconciliation']).map((option) => (
                    <option key={option} value={option}>
                      {option === 'Opening Stock' ? 'رصيد افتتاحي' : 'تسوية مخزون'}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field" htmlFor="stock-reconciliation-posting-date">
                <span>تاريخ القيد</span>
                <input id="stock-reconciliation-posting-date" disabled={disabled} type="date" {...register('posting_date')} />
              </label>

              <label className="field" htmlFor="stock-reconciliation-posting-time">
                <span>وقت القيد</span>
                <input id="stock-reconciliation-posting-time" disabled={disabled} type="time" {...register('posting_time')} />
              </label>

              <label className="check-field">
                <input disabled={disabled} type="checkbox" {...register('set_posting_time')} />
                <span>تثبيت التاريخ والوقت على الجرد</span>
              </label>

              <label className="field" htmlFor="stock-reconciliation-expense-account">
                <span>حساب فروقات المخزون</span>
                <LinkDatalistInput
                  id="stock-reconciliation-expense-account"
                  disabled={disabled}
                  doctype="Account"
                  listId="stock-reconciliation-expense-account-options"
                  registration={register('expense_account')}
                />
              </label>

              <label className="field" htmlFor="stock-reconciliation-cost-center">
                <span>مركز التكلفة</span>
                <LinkDatalistInput
                  id="stock-reconciliation-cost-center"
                  disabled={disabled}
                  doctype="Cost Center"
                  listId="stock-reconciliation-cost-center-options"
                  registration={register('cost_center')}
                />
              </label>

              <label className="field field-wide" htmlFor="stock-reconciliation-remarks">
                <span>ملاحظات</span>
                <textarea id="stock-reconciliation-remarks" disabled={disabled} rows={3} {...register('remarks')} />
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading split">
              <div>
                <h4>أصناف الجرد</h4>
                <p>كل صف يظهر الرصيد الحالي من `Bin` ثم يسمح لك بكتابة الرصيد الصحيح الذي تريد اعتماده.</p>
              </div>
              <button className="button button-secondary" disabled={disabled} type="button" onClick={() => append(createEmptyStockReconciliationItem())}>
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
                const warehouseField = register(`items.${index}.warehouse`)
                const qtyField = register(`items.${index}.qty`, {
                  setValueAs: (value) => (value === '' ? 0 : Number(value)),
                })
                const valuationRateField = register(`items.${index}.valuation_rate`, {
                  setValueAs: (value) => (value === '' ? undefined : Number(value)),
                })
                const currentAmount = Number(items[index]?.current_amount) || 0
                const adjustedAmount = (Number(items[index]?.qty) || 0) * (Number(items[index]?.valuation_rate) || 0)

                return (
                  <article className="line-item-card" key={field.id}>
                    <div className="line-item-head">
                      <strong>الصنف {index + 1}</strong>
                      <div className="line-item-controls">
                        <button
                          className="icon-button"
                          disabled={disabled}
                          title="تحميل الرصيد الحالي"
                          type="button"
                          onClick={() => {
                            void handleItemLookup(index, getValues(`items.${index}.item_code`), getValues(`items.${index}.warehouse`))
                          }}
                        >
                          <ArrowDownToLine size={16} aria-hidden="true" />
                          <span className="sr-only">تحميل الرصيد الحالي</span>
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
                      <label className="field" htmlFor={`reconciliation-item-code-${index}`}>
                        <span>كود الصنف</span>
                        <LinkDatalistInput
                          id={`reconciliation-item-code-${index}`}
                          disabled={disabled}
                          doctype="Item"
                          errorText={errors.items?.[index]?.item_code?.message}
                          listId={`reconciliation-item-options-${index}`}
                          registration={itemCodeField}
                          onBlur={(event) => {
                            void handleItemLookup(index, event.currentTarget.value, getValues(`items.${index}.warehouse`))
                          }}
                        />
                      </label>

                      <label className="field" htmlFor={`reconciliation-item-name-${index}`}>
                        <span>اسم الصنف</span>
                        <input id={`reconciliation-item-name-${index}`} disabled readOnly {...register(`items.${index}.item_name`)} />
                      </label>

                      <label className="field" htmlFor={`reconciliation-warehouse-${index}`}>
                        <span>المستودع</span>
                        <LinkDatalistInput
                          id={`reconciliation-warehouse-${index}`}
                          disabled={disabled}
                          doctype="Warehouse"
                          errorText={errors.items?.[index]?.warehouse?.message}
                          listId={`reconciliation-warehouse-options-${index}`}
                          registration={warehouseField}
                          onBlur={(event) => {
                            void handleItemLookup(index, getValues(`items.${index}.item_code`), event.currentTarget.value)
                          }}
                        />
                      </label>

                      <label className="field" htmlFor={`reconciliation-current-qty-${index}`}>
                        <span>الرصيد الحالي</span>
                        <input id={`reconciliation-current-qty-${index}`} disabled readOnly value={items[index]?.current_qty ?? 0} />
                      </label>

                      <label className="field" htmlFor={`reconciliation-counted-qty-${index}`}>
                        <span>الرصيد المعدّل</span>
                        <input id={`reconciliation-counted-qty-${index}`} disabled={disabled} min="0" step="0.01" type="number" {...qtyField} />
                      </label>

                      <label className="field" htmlFor={`reconciliation-current-rate-${index}`}>
                        <span>سعر التقييم الحالي</span>
                        <input
                          id={`reconciliation-current-rate-${index}`}
                          disabled
                          readOnly
                          value={items[index]?.current_valuation_rate ?? ''}
                        />
                      </label>

                      <label className="field" htmlFor={`reconciliation-rate-${index}`}>
                        <span>سعر التقييم المعدّل</span>
                        <input id={`reconciliation-rate-${index}`} disabled={disabled} min="0" step="0.01" type="number" {...valuationRateField} />
                      </label>

                      <label className="field" htmlFor={`reconciliation-batch-${index}`}>
                        <span>Batch</span>
                        <LinkDatalistInput
                          id={`reconciliation-batch-${index}`}
                          disabled={disabled}
                          doctype="Batch"
                          listId={`reconciliation-batch-options-${index}`}
                          registration={register(`items.${index}.batch_no`)}
                        />
                      </label>

                      <label className="field field-wide" htmlFor={`reconciliation-bundle-${index}`}>
                        <span>Serial / Batch Bundle</span>
                        <LinkDatalistInput
                          id={`reconciliation-bundle-${index}`}
                          disabled={disabled}
                          doctype="Serial and Batch Bundle"
                          listId={`reconciliation-bundle-options-${index}`}
                          registration={register(`items.${index}.serial_and_batch_bundle`)}
                        />
                      </label>
                    </div>

                    <div className="line-item-foot">
                      <span>القيمة الحالية: {currentAmount.toFixed(2)}</span>
                      <strong>القيمة بعد التسوية: {adjustedAmount.toFixed(2)}</strong>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </div>

        <aside className="form-aside" aria-label="ملخص الجرد">
          <p className="eyebrow">ملخص فوري</p>
          <h4>قراءة سريعة قبل الحفظ</h4>
          <ul>
            <li>الشركة: {company || 'غير محددة بعد'}</li>
            <li>الغرض: {purpose === 'Opening Stock' ? 'رصيد افتتاحي' : 'تسوية مخزون'}</li>
            <li>عدد الأصناف: {items.length}</li>
            <li>القيمة الحالية: {totalCurrentAmount.toFixed(2)}</li>
            <li>القيمة بعد التسوية: {totalAdjustedAmount.toFixed(2)}</li>
            <li>فرق الكمية الإجمالي: {quantityDelta.toFixed(2)}</li>
          </ul>
        </aside>
      </div>
    </form>
  )
}

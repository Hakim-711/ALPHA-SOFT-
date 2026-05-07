import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownToLine, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { LinkDatalistInput } from '@/shared/ui/link-datalist-input'
import { formatDateInputValue } from '@/shared/utils/date'
import { createEmptySalesInvoiceItem, getSalesInvoiceItemPrefill } from '../api/sales-invoices.api'
import { salesInvoiceSchema, type SalesInvoiceSchema } from '../schemas/sales-invoice.schema'
import { useSalesInvoiceDefaults } from '../hooks/use-sales-invoice-defaults'
import type { SalesInvoiceAccountOption, SalesInvoiceCompanyOption, SalesInvoiceFormValues } from '../types/sales-invoice.types'

interface SalesInvoiceFormProps {
  initialValues?: Partial<SalesInvoiceFormValues>
  isSubmitting?: boolean
  readOnly?: boolean
  onSubmit: (values: SalesInvoiceFormValues) => void | Promise<void>
}

function findCompany(companies: SalesInvoiceCompanyOption[], companyName?: string) {
  return companies.find((company) => company.name === companyName)
}

function findAccountCurrency(accounts: SalesInvoiceAccountOption[], accountName?: string) {
  if (!accountName) {
    return ''
  }

  return accounts.find((account) => account.name === accountName)?.account_currency ?? ''
}

export function SalesInvoiceForm({
  initialValues,
  isSubmitting = false,
  readOnly = false,
  onSubmit,
}: SalesInvoiceFormProps) {
  const defaultsQuery = useSalesInvoiceDefaults()
  const {
    control,
    getValues,
    handleSubmit,
    register,
    setValue,
    formState: { errors },
  } = useForm<SalesInvoiceSchema>({
    resolver: zodResolver(salesInvoiceSchema),
    defaultValues: {
      customer: initialValues?.customer ?? '',
      company: initialValues?.company ?? '',
      posting_date: initialValues?.posting_date ?? formatDateInputValue(),
      due_date: initialValues?.due_date ?? initialValues?.posting_date ?? formatDateInputValue(),
      currency: initialValues?.currency ?? '',
      conversion_rate: initialValues?.conversion_rate ?? 1,
      selling_price_list: initialValues?.selling_price_list ?? '',
      set_warehouse: initialValues?.set_warehouse ?? '',
      debit_to: initialValues?.debit_to ?? '',
      update_stock: initialValues?.update_stock ?? true,
      remarks: initialValues?.remarks ?? '',
      items: initialValues?.items?.length ? initialValues.items : [createEmptySalesInvoiceItem()],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const watchedItems = useWatch({ control, name: 'items' })
  const items = watchedItems ?? []
  const company = useWatch({ control, name: 'company' }) ?? ''
  const orderWarehouse = useWatch({ control, name: 'set_warehouse' }) ?? ''
  const debitTo = useWatch({ control, name: 'debit_to' }) ?? ''
  const defaults = defaultsQuery.data
  const disabled = isSubmitting || readOnly
  const provisionalTotal = items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0)
  const receivableAccounts = useMemo(
    () => (defaults?.receivableAccounts ?? []).filter((account) => !company || account.company === company),
    [company, defaults?.receivableAccounts],
  )
  const selectedCompany = useMemo(() => findCompany(defaults?.companies ?? [], company), [company, defaults?.companies])
  const receivableCurrency = useMemo(
    () => findAccountCurrency(defaults?.receivableAccounts ?? [], debitTo),
    [debitTo, defaults?.receivableAccounts],
  )

  useEffect(() => {
    if (!defaults) {
      return
    }

    if (!getValues('company') && defaults.companies[0]?.name) {
      setValue('company', defaults.companies[0].name)
    }

    if (!getValues('currency')) {
      const fallbackCurrency = defaults.companies[0]?.default_currency ?? defaults.priceLists[0]?.currency
      if (fallbackCurrency) {
        setValue('currency', fallbackCurrency)
      }
    }

    if (!getValues('selling_price_list') && defaults.priceLists[0]?.name) {
      setValue('selling_price_list', defaults.priceLists[0].name)
    }
  }, [defaults, getValues, setValue])

  useEffect(() => {
    if (!defaults || !company) {
      return
    }

    const currentDebitTo = getValues('debit_to')
    const companyReceivableAccounts = defaults.receivableAccounts.filter((account) => account.company === company)
    const fallbackDebitTo = selectedCompany?.default_receivable_account ?? companyReceivableAccounts[0]?.name ?? ''

    if (!currentDebitTo || !companyReceivableAccounts.some((account) => account.name === currentDebitTo)) {
      setValue('debit_to', fallbackDebitTo)
    }

    if (selectedCompany?.default_currency && getValues('currency') !== selectedCompany.default_currency) {
      setValue('currency', selectedCompany.default_currency)
    }
  }, [company, defaults, getValues, selectedCompany, setValue])

  async function handleItemLookup(index: number, itemCode: string) {
    const trimmedCode = itemCode.trim()

    if (!trimmedCode || disabled) {
      return
    }

    try {
      const item = await getSalesInvoiceItemPrefill(trimmedCode)
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
    append(createEmptySalesInvoiceItem())
  }

  return (
    <form className="form-layout" onSubmit={handleSubmit(async (values) => onSubmit(values))}>
      <div className="form-header">
        <div>
          <p className="eyebrow">مستند محاسبي تشغيلي</p>
          <h3>{initialValues ? 'تعديل فاتورة بيع' : 'إنشاء فاتورة بيع'}</h3>
          <p>هذه الواجهة تكتب مباشرة إلى `Sales Invoice` داخل ERPNext مع الحفاظ على الذمم والإجماليات ومنطق الاعتماد.</p>
        </div>
        <button className="button button-primary" disabled={disabled} type="submit">
          <Save size={17} aria-hidden="true" />
          {isSubmitting ? 'جاري الحفظ' : 'حفظ الفاتورة'}
        </button>
      </div>

      <div className="form-content">
        <div className="form-main">
          <section className="form-section">
            <div className="section-heading">
              <h4>رأس الفاتورة</h4>
              <p>العميل والشركة وتاريخ القيد وحساب الذمم هي العناصر التي يبني عليها ERPNext الأثر المحاسبي النهائي.</p>
            </div>

            <div className="field-grid">
              <label className="field" htmlFor="sales-invoice-customer">
                <span>العميل</span>
                <LinkDatalistInput
                  id="sales-invoice-customer"
                  disabled={disabled}
                  doctype="Customer"
                  errorText={errors.customer?.message}
                  listId="sales-invoice-customer-options"
                  registration={register('customer')}
                />
              </label>

              <label className="field" htmlFor="sales-invoice-company">
                <span>الشركة</span>
                <LinkDatalistInput
                  id="sales-invoice-company"
                  disabled={disabled}
                  doctype="Company"
                  errorText={errors.company?.message}
                  listId="sales-invoice-company-options"
                  registration={register('company')}
                />
              </label>

              <label className="field" htmlFor="sales-invoice-posting-date">
                <span>تاريخ القيد</span>
                <input id="sales-invoice-posting-date" disabled={disabled} type="date" {...register('posting_date')} />
                {errors.posting_date ? <small>{errors.posting_date.message}</small> : null}
              </label>

              <label className="field" htmlFor="sales-invoice-due-date">
                <span>تاريخ الاستحقاق</span>
                <input id="sales-invoice-due-date" disabled={disabled} type="date" {...register('due_date')} />
              </label>

              <label className="field" htmlFor="sales-invoice-currency">
                <span>العملة</span>
                <LinkDatalistInput
                  id="sales-invoice-currency"
                  disabled={disabled}
                  doctype="Currency"
                  errorText={errors.currency?.message}
                  listId="sales-invoice-currency-options"
                  registration={register('currency')}
                />
              </label>

              <label className="field" htmlFor="sales-invoice-conversion-rate">
                <span>سعر التحويل</span>
                <input
                  id="sales-invoice-conversion-rate"
                  disabled={disabled}
                  min="0.000001"
                  step="0.000001"
                  type="number"
                  {...register('conversion_rate', {
                    setValueAs: (value) => (value === '' ? 1 : Number(value)),
                  })}
                />
              </label>

              <label className="field" htmlFor="sales-invoice-price-list">
                <span>قائمة الأسعار</span>
                <LinkDatalistInput
                  id="sales-invoice-price-list"
                  disabled={disabled}
                  doctype="Price List"
                  errorText={errors.selling_price_list?.message}
                  listId="sales-invoice-price-list-options"
                  registration={register('selling_price_list')}
                />
              </label>

              <label className="field" htmlFor="sales-invoice-warehouse">
                <span>المستودع الافتراضي</span>
                <LinkDatalistInput
                  id="sales-invoice-warehouse"
                  disabled={disabled}
                  doctype="Warehouse"
                  listId="sales-invoice-warehouse-options"
                  registration={register('set_warehouse')}
                />
              </label>

              <label className="field field-wide" htmlFor="sales-invoice-debit-to">
                <span>حساب الذمم</span>
                <input
                  id="sales-invoice-debit-to"
                  list="sales-invoice-debit-to-options"
                  disabled={disabled}
                  {...register('debit_to')}
                />
                <datalist id="sales-invoice-debit-to-options">
                  {receivableAccounts.map((account) => (
                    <option key={account.name} value={account.name} />
                  ))}
                </datalist>
                {errors.debit_to ? (
                  <small>{errors.debit_to.message}</small>
                ) : (
                  <em>{receivableCurrency ? `عملة الحساب: ${receivableCurrency}` : 'اختر حساب الذمم المناسب للشركة.'}</em>
                )}
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading split">
              <div>
                <h4>أصناف الفاتورة</h4>
                <p>كل صف هنا يتحول إلى `Sales Invoice Item` داخل ERPNext، ويعاد حساب الإجماليات على السيرفر بعد الحفظ.</p>
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
                      <label className="field" htmlFor={`sales-invoice-item-code-${index}`}>
                        <span>كود الصنف</span>
                        <LinkDatalistInput
                          id={`sales-invoice-item-code-${index}`}
                          disabled={disabled}
                          doctype="Item"
                          errorText={errors.items?.[index]?.item_code?.message}
                          listId={`sales-invoice-item-options-${index}`}
                          registration={itemCodeField}
                          onBlur={(event) => {
                            void handleItemLookup(index, event.currentTarget.value)
                          }}
                        />
                      </label>

                      <label className="field" htmlFor={`sales-invoice-item-name-${index}`}>
                        <span>اسم الصنف</span>
                        <input id={`sales-invoice-item-name-${index}`} disabled={disabled} {...register(`items.${index}.item_name`)} />
                        {errors.items?.[index]?.item_name ? <small>{errors.items[index]?.item_name?.message}</small> : null}
                      </label>

                      <label className="field" htmlFor={`sales-invoice-item-qty-${index}`}>
                        <span>الكمية</span>
                        <input id={`sales-invoice-item-qty-${index}`} disabled={disabled} min="0.01" step="0.01" type="number" {...quantityField} />
                        {errors.items?.[index]?.qty ? <small>{errors.items[index]?.qty?.message}</small> : null}
                      </label>

                      <label className="field" htmlFor={`sales-invoice-item-uom-${index}`}>
                        <span>وحدة القياس</span>
                        <LinkDatalistInput
                          id={`sales-invoice-item-uom-${index}`}
                          disabled={disabled}
                          doctype="UOM"
                          errorText={errors.items?.[index]?.uom?.message}
                          listId={`sales-invoice-uom-options-${index}`}
                          registration={register(`items.${index}.uom`)}
                        />
                      </label>

                      <label className="field" htmlFor={`sales-invoice-item-stock-uom-${index}`}>
                        <span>وحدة المخزون</span>
                        <input id={`sales-invoice-item-stock-uom-${index}`} disabled readOnly {...register(`items.${index}.stock_uom`)} />
                      </label>

                      <label className="field" htmlFor={`sales-invoice-item-rate-${index}`}>
                        <span>السعر</span>
                        <input id={`sales-invoice-item-rate-${index}`} disabled={disabled} min="0" step="0.01" type="number" {...rateField} />
                        {errors.items?.[index]?.rate ? <small>{errors.items[index]?.rate?.message}</small> : null}
                      </label>

                      <label className="field" htmlFor={`sales-invoice-item-warehouse-${index}`}>
                        <span>المستودع</span>
                        <LinkDatalistInput
                          id={`sales-invoice-item-warehouse-${index}`}
                          disabled={disabled}
                          doctype="Warehouse"
                          listId={`sales-invoice-row-warehouse-options-${index}`}
                          registration={register(`items.${index}.warehouse`)}
                        />
                      </label>

                      <label className="field field-wide" htmlFor={`sales-invoice-item-description-${index}`}>
                        <span>الوصف</span>
                        <textarea id={`sales-invoice-item-description-${index}`} disabled={disabled} rows={2} {...register(`items.${index}.description`)} />
                      </label>
                    </div>

                    <div className="line-item-foot">
                      <span>الإجمالي التقديري للصف</span>
                      <strong>{((Number(items[index]?.qty) || 0) * (Number(items[index]?.rate) || 0)).toFixed(2)}</strong>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading">
              <h4>إعدادات إضافية</h4>
              <p>هذه الخيارات تتحكم في سلوك الفاتورة بالنسبة للمخزون والملاحظات التشغيلية.</p>
            </div>

            <div className="field-grid">
              <label className="check-field">
                <input disabled={disabled} type="checkbox" {...register('update_stock')} />
                <span>تحديث المخزون عند الاعتماد</span>
              </label>

              <label className="field field-wide" htmlFor="sales-invoice-remarks">
                <span>ملاحظات</span>
                <textarea id="sales-invoice-remarks" disabled={disabled} rows={3} {...register('remarks')} />
              </label>
            </div>
          </section>
        </div>

        <aside className="form-aside" aria-label="ملخص فاتورة البيع">
          <p className="eyebrow">ملخص فوري</p>
          <h4>قراءة سريعة قبل الحفظ</h4>
          <ul>
            <li>عدد الأصناف: {items.length}</li>
            <li>الإجمالي التقديري: {provisionalTotal.toFixed(2)}</li>
            <li>حساب الذمم: {debitTo || 'غير محدد بعد'}</li>
            <li>ERPNext سيعيد حساب الإجماليات والاستحقاق النهائي بعد الحفظ.</li>
          </ul>
        </aside>
      </div>
    </form>
  )
}

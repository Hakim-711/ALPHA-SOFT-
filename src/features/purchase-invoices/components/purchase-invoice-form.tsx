import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownToLine, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { LinkDatalistInput } from '@/shared/ui/link-datalist-input'
import { formatDateInputValue } from '@/shared/utils/date'
import { createEmptyPurchaseInvoiceItem, getPurchaseInvoiceItemPrefill } from '../api/purchase-invoices.api'
import { usePurchaseInvoiceDefaults } from '../hooks/use-purchase-invoice-defaults'
import { purchaseInvoiceSchema, type PurchaseInvoiceSchema } from '../schemas/purchase-invoice.schema'
import type {
  PurchaseInvoiceAccountOption,
  PurchaseInvoiceCompanyOption,
  PurchaseInvoiceFormValues,
} from '../types/purchase-invoice.types'

interface PurchaseInvoiceFormProps {
  initialValues?: Partial<PurchaseInvoiceFormValues>
  isSubmitting?: boolean
  readOnly?: boolean
  onSubmit: (values: PurchaseInvoiceFormValues) => void | Promise<void>
}

function findCompany(companies: PurchaseInvoiceCompanyOption[], companyName?: string) {
  return companies.find((company) => company.name === companyName)
}

function findAccountCurrency(accounts: PurchaseInvoiceAccountOption[], accountName?: string) {
  if (!accountName) {
    return ''
  }

  return accounts.find((account) => account.name === accountName)?.account_currency ?? ''
}

export function PurchaseInvoiceForm({
  initialValues,
  isSubmitting = false,
  readOnly = false,
  onSubmit,
}: PurchaseInvoiceFormProps) {
  const defaultsQuery = usePurchaseInvoiceDefaults()
  const {
    control,
    getValues,
    handleSubmit,
    register,
    setValue,
    formState: { errors },
  } = useForm<PurchaseInvoiceSchema>({
    resolver: zodResolver(purchaseInvoiceSchema),
    defaultValues: {
      supplier: initialValues?.supplier ?? '',
      company: initialValues?.company ?? '',
      posting_date: initialValues?.posting_date ?? formatDateInputValue(),
      due_date: initialValues?.due_date ?? initialValues?.posting_date ?? formatDateInputValue(),
      currency: initialValues?.currency ?? '',
      conversion_rate: initialValues?.conversion_rate ?? 1,
      buying_price_list: initialValues?.buying_price_list ?? '',
      set_warehouse: initialValues?.set_warehouse ?? '',
      credit_to: initialValues?.credit_to ?? '',
      update_stock: initialValues?.update_stock ?? true,
      remarks: initialValues?.remarks ?? '',
      items: initialValues?.items?.length ? initialValues.items : [createEmptyPurchaseInvoiceItem()],
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
  const creditTo = useWatch({ control, name: 'credit_to' }) ?? ''
  const defaults = defaultsQuery.data
  const disabled = isSubmitting || readOnly
  const provisionalTotal = items.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.rate) || 0), 0)
  const payableAccounts = useMemo(
    () => (defaults?.payableAccounts ?? []).filter((account) => !company || account.company === company),
    [company, defaults?.payableAccounts],
  )
  const selectedCompany = useMemo(() => findCompany(defaults?.companies ?? [], company), [company, defaults?.companies])
  const payableCurrency = useMemo(
    () => findAccountCurrency(defaults?.payableAccounts ?? [], creditTo),
    [creditTo, defaults?.payableAccounts],
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

    if (!getValues('buying_price_list') && defaults.priceLists[0]?.name) {
      setValue('buying_price_list', defaults.priceLists[0].name)
    }
  }, [defaults, getValues, setValue])

  useEffect(() => {
    if (!defaults || !company) {
      return
    }

    const currentCreditTo = getValues('credit_to')
    const companyPayableAccounts = defaults.payableAccounts.filter((account) => account.company === company)
    const fallbackCreditTo = selectedCompany?.default_payable_account ?? companyPayableAccounts[0]?.name ?? ''

    if (!currentCreditTo || !companyPayableAccounts.some((account) => account.name === currentCreditTo)) {
      setValue('credit_to', fallbackCreditTo)
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
      const item = await getPurchaseInvoiceItemPrefill(trimmedCode)
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
    append(createEmptyPurchaseInvoiceItem())
  }

  return (
    <form className="form-layout" onSubmit={handleSubmit(async (values) => onSubmit(values))}>
      <div className="form-header">
        <div>
          <p className="eyebrow">مستند محاسبي تشغيلي</p>
          <h3>{initialValues ? 'تعديل فاتورة شراء' : 'إنشاء فاتورة شراء'}</h3>
          <p>هذه الواجهة تكتب مباشرة إلى `Purchase Invoice` داخل ERPNext مع الحفاظ على الدائنين والإجماليات ومنطق الاعتماد.</p>
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
              <p>المورد والشركة وتاريخ القيد وحساب الدائنين هي العناصر التي يبني عليها ERPNext الأثر المحاسبي النهائي.</p>
            </div>

            <div className="field-grid">
              <label className="field" htmlFor="purchase-invoice-supplier">
                <span>المورد</span>
                <LinkDatalistInput
                  id="purchase-invoice-supplier"
                  disabled={disabled}
                  doctype="Supplier"
                  errorText={errors.supplier?.message}
                  listId="purchase-invoice-supplier-options"
                  registration={register('supplier')}
                />
              </label>

              <label className="field" htmlFor="purchase-invoice-company">
                <span>الشركة</span>
                <LinkDatalistInput
                  id="purchase-invoice-company"
                  disabled={disabled}
                  doctype="Company"
                  errorText={errors.company?.message}
                  listId="purchase-invoice-company-options"
                  registration={register('company')}
                />
              </label>

              <label className="field" htmlFor="purchase-invoice-posting-date">
                <span>تاريخ القيد</span>
                <input id="purchase-invoice-posting-date" disabled={disabled} type="date" {...register('posting_date')} />
                {errors.posting_date ? <small>{errors.posting_date.message}</small> : null}
              </label>

              <label className="field" htmlFor="purchase-invoice-due-date">
                <span>تاريخ الاستحقاق</span>
                <input id="purchase-invoice-due-date" disabled={disabled} type="date" {...register('due_date')} />
              </label>

              <label className="field" htmlFor="purchase-invoice-currency">
                <span>العملة</span>
                <LinkDatalistInput
                  id="purchase-invoice-currency"
                  disabled={disabled}
                  doctype="Currency"
                  errorText={errors.currency?.message}
                  listId="purchase-invoice-currency-options"
                  registration={register('currency')}
                />
              </label>

              <label className="field" htmlFor="purchase-invoice-conversion-rate">
                <span>سعر التحويل</span>
                <input
                  id="purchase-invoice-conversion-rate"
                  disabled={disabled}
                  min="0.000001"
                  step="0.000001"
                  type="number"
                  {...register('conversion_rate', {
                    setValueAs: (value) => (value === '' ? 1 : Number(value)),
                  })}
                />
              </label>

              <label className="field" htmlFor="purchase-invoice-price-list">
                <span>قائمة الأسعار</span>
                <LinkDatalistInput
                  id="purchase-invoice-price-list"
                  disabled={disabled}
                  doctype="Price List"
                  errorText={errors.buying_price_list?.message}
                  listId="purchase-invoice-price-list-options"
                  registration={register('buying_price_list')}
                />
              </label>

              <label className="field" htmlFor="purchase-invoice-warehouse">
                <span>المستودع الافتراضي</span>
                <LinkDatalistInput
                  id="purchase-invoice-warehouse"
                  disabled={disabled}
                  doctype="Warehouse"
                  listId="purchase-invoice-warehouse-options"
                  registration={register('set_warehouse')}
                />
              </label>

              <label className="field field-wide" htmlFor="purchase-invoice-credit-to">
                <span>حساب الدائنين</span>
                <input id="purchase-invoice-credit-to" list="purchase-invoice-credit-to-options" disabled={disabled} {...register('credit_to')} />
                <datalist id="purchase-invoice-credit-to-options">
                  {payableAccounts.map((account) => (
                    <option key={account.name} value={account.name} />
                  ))}
                </datalist>
                {errors.credit_to ? (
                  <small>{errors.credit_to.message}</small>
                ) : (
                  <em>{payableCurrency ? `عملة الحساب: ${payableCurrency}` : 'اختر حساب الدائنين المناسب للشركة.'}</em>
                )}
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading split">
              <div>
                <h4>أصناف الفاتورة</h4>
                <p>كل صف هنا يتحول إلى `Purchase Invoice Item` داخل ERPNext، ويعاد حساب الإجماليات على السيرفر بعد الحفظ.</p>
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
                      <label className="field" htmlFor={`purchase-invoice-item-code-${index}`}>
                        <span>كود الصنف</span>
                        <LinkDatalistInput
                          id={`purchase-invoice-item-code-${index}`}
                          disabled={disabled}
                          doctype="Item"
                          errorText={errors.items?.[index]?.item_code?.message}
                          listId={`purchase-invoice-item-options-${index}`}
                          registration={itemCodeField}
                          onBlur={(event) => {
                            void handleItemLookup(index, event.currentTarget.value)
                          }}
                        />
                      </label>

                      <label className="field" htmlFor={`purchase-invoice-item-name-${index}`}>
                        <span>اسم الصنف</span>
                        <input id={`purchase-invoice-item-name-${index}`} disabled={disabled} {...register(`items.${index}.item_name`)} />
                        {errors.items?.[index]?.item_name ? <small>{errors.items[index]?.item_name?.message}</small> : null}
                      </label>

                      <label className="field" htmlFor={`purchase-invoice-item-qty-${index}`}>
                        <span>الكمية</span>
                        <input id={`purchase-invoice-item-qty-${index}`} disabled={disabled} min="0.01" step="0.01" type="number" {...quantityField} />
                        {errors.items?.[index]?.qty ? <small>{errors.items[index]?.qty?.message}</small> : null}
                      </label>

                      <label className="field" htmlFor={`purchase-invoice-item-uom-${index}`}>
                        <span>وحدة القياس</span>
                        <LinkDatalistInput
                          id={`purchase-invoice-item-uom-${index}`}
                          disabled={disabled}
                          doctype="UOM"
                          errorText={errors.items?.[index]?.uom?.message}
                          listId={`purchase-invoice-uom-options-${index}`}
                          registration={register(`items.${index}.uom`)}
                        />
                      </label>

                      <label className="field" htmlFor={`purchase-invoice-item-stock-uom-${index}`}>
                        <span>وحدة المخزون</span>
                        <input id={`purchase-invoice-item-stock-uom-${index}`} disabled readOnly {...register(`items.${index}.stock_uom`)} />
                      </label>

                      <label className="field" htmlFor={`purchase-invoice-item-rate-${index}`}>
                        <span>السعر</span>
                        <input id={`purchase-invoice-item-rate-${index}`} disabled={disabled} min="0" step="0.01" type="number" {...rateField} />
                        {errors.items?.[index]?.rate ? <small>{errors.items[index]?.rate?.message}</small> : null}
                      </label>

                      <label className="field" htmlFor={`purchase-invoice-item-warehouse-${index}`}>
                        <span>المستودع</span>
                        <LinkDatalistInput
                          id={`purchase-invoice-item-warehouse-${index}`}
                          disabled={disabled}
                          doctype="Warehouse"
                          listId={`purchase-invoice-row-warehouse-options-${index}`}
                          registration={register(`items.${index}.warehouse`)}
                        />
                      </label>

                      <label className="field" htmlFor={`purchase-invoice-item-purchase-order-${index}`}>
                        <span>أمر الشراء المرتبط</span>
                        <LinkDatalistInput
                          id={`purchase-invoice-item-purchase-order-${index}`}
                          disabled={disabled}
                          doctype="Purchase Order"
                          listId={`purchase-invoice-row-purchase-order-options-${index}`}
                          registration={register(`items.${index}.purchase_order`)}
                        />
                      </label>

                      <label className="field field-wide" htmlFor={`purchase-invoice-item-description-${index}`}>
                        <span>الوصف</span>
                        <textarea id={`purchase-invoice-item-description-${index}`} disabled={disabled} rows={2} {...register(`items.${index}.description`)} />
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

              <label className="field field-wide" htmlFor="purchase-invoice-remarks">
                <span>ملاحظات</span>
                <textarea id="purchase-invoice-remarks" disabled={disabled} rows={3} {...register('remarks')} />
              </label>
            </div>
          </section>
        </div>

        <aside className="form-aside" aria-label="ملخص فاتورة الشراء">
          <p className="eyebrow">ملخص فوري</p>
          <h4>قراءة سريعة قبل الحفظ</h4>
          <ul>
            <li>عدد الأصناف: {items.length}</li>
            <li>الإجمالي التقديري: {provisionalTotal.toFixed(2)}</li>
            <li>حساب الدائنين: {creditTo || 'غير محدد بعد'}</li>
            <li>ERPNext سيعيد حساب الإجماليات والاستحقاق النهائي بعد الحفظ.</li>
          </ul>
        </aside>
      </div>
    </form>
  )
}

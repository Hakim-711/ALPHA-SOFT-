import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownCircle, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { LinkDatalistInput } from '@/shared/ui/link-datalist-input'
import { formatDateInputValue } from '@/shared/utils/date'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { collectionSchema, type CollectionSchema } from '../schemas/collection.schema'
import { createReferenceFromInvoice } from '../api/collections.api'
import { useCollectionDefaults } from '../hooks/use-collection-defaults'
import { useOutstandingCustomerInvoices } from '../hooks/use-outstanding-customer-invoices'
import type {
  CollectionAccountOption,
  CollectionCompanyOption,
  CollectionFormValues,
  CollectionOutstandingInvoice,
} from '../types/collection.types'

interface CollectionFormProps {
  initialValues?: Partial<CollectionFormValues>
  isSubmitting?: boolean
  readOnly?: boolean
  onSubmit: (values: CollectionFormValues) => void | Promise<void>
}

function roundAmount(value: number) {
  return Math.round(value * 100) / 100
}

function calculateReceivedAmount(paidAmount: number, sourceExchangeRate: number, targetExchangeRate: number) {
  if (!paidAmount || !sourceExchangeRate || !targetExchangeRate) {
    return 0
  }

  return roundAmount((paidAmount * sourceExchangeRate) / targetExchangeRate)
}

function findAccountCurrency(accounts: CollectionAccountOption[], accountName?: string) {
  if (!accountName) {
    return ''
  }

  return accounts.find((account) => account.name === accountName)?.account_currency ?? ''
}

function findCompany(companies: CollectionCompanyOption[], companyName?: string) {
  return companies.find((company) => company.name === companyName)
}

export function CollectionForm({
  initialValues,
  isSubmitting = false,
  readOnly = false,
  onSubmit,
}: CollectionFormProps) {
  const defaultsQuery = useCollectionDefaults()
  const {
    control,
    getValues,
    handleSubmit,
    register,
    setValue,
    formState: { errors },
  } = useForm<CollectionSchema>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      company: initialValues?.company ?? '',
      posting_date: initialValues?.posting_date ?? formatDateInputValue(),
      customer: initialValues?.customer ?? '',
      paid_from: initialValues?.paid_from ?? '',
      paid_to: initialValues?.paid_to ?? '',
      paid_amount: initialValues?.paid_amount ?? 0,
      received_amount: initialValues?.received_amount ?? 0,
      source_exchange_rate: initialValues?.source_exchange_rate ?? 1,
      target_exchange_rate: initialValues?.target_exchange_rate ?? 1,
      mode_of_payment: initialValues?.mode_of_payment ?? '',
      reference_no: initialValues?.reference_no ?? '',
      reference_date: initialValues?.reference_date ?? '',
      remarks: initialValues?.remarks ?? '',
      references: initialValues?.references ?? [],
    },
  })
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'references',
  })
  const company = useWatch({ control, name: 'company' }) ?? ''
  const customer = useWatch({ control, name: 'customer' }) ?? ''
  const paidFrom = useWatch({ control, name: 'paid_from' }) ?? ''
  const paidTo = useWatch({ control, name: 'paid_to' }) ?? ''
  const paidAmount = Number(useWatch({ control, name: 'paid_amount' }) ?? 0)
  const receivedAmount = Number(useWatch({ control, name: 'received_amount' }) ?? 0)
  const sourceExchangeRate = Number(useWatch({ control, name: 'source_exchange_rate' }) ?? 1)
  const targetExchangeRate = Number(useWatch({ control, name: 'target_exchange_rate' }) ?? 1)
  const watchedReferences = useWatch({ control, name: 'references' })
  const outstandingInvoicesQuery = useOutstandingCustomerInvoices({
    customer,
    company,
  })
  const defaults = defaultsQuery.data
  const disabled = isSubmitting || readOnly
  const references = useMemo(() => watchedReferences ?? [], [watchedReferences])
  const selectedCompany = useMemo(() => findCompany(defaults?.companies ?? [], company), [company, defaults?.companies])
  const receivableAccounts = useMemo(
    () => (defaults?.receivableAccounts ?? []).filter((account) => !company || account.company === company),
    [company, defaults?.receivableAccounts],
  )
  const paymentAccounts = useMemo(
    () => (defaults?.paymentAccounts ?? []).filter((account) => !company || account.company === company),
    [company, defaults?.paymentAccounts],
  )
  const sourceCurrency = useMemo(
    () => findAccountCurrency(defaults?.receivableAccounts ?? [], paidFrom),
    [defaults?.receivableAccounts, paidFrom],
  )
  const targetCurrency = useMemo(
    () => findAccountCurrency(defaults?.paymentAccounts ?? [], paidTo),
    [defaults?.paymentAccounts, paidTo],
  )
  const totalAllocatedAmount = references.reduce((sum, reference) => sum + (Number(reference.allocated_amount) || 0), 0)
  const calculatedReceivedAmount = calculateReceivedAmount(paidAmount, sourceExchangeRate, targetExchangeRate)
  const differencePreview = roundAmount(Math.abs((paidAmount || 0) * sourceExchangeRate - receivedAmount * targetExchangeRate))
  const availableInvoices = useMemo(() => {
    const selectedNames = new Set(references.map((reference) => reference.reference_name))
    return (outstandingInvoicesQuery.data ?? []).filter((invoice) => !selectedNames.has(invoice.name))
  }, [outstandingInvoicesQuery.data, references])

  useEffect(() => {
    if (!defaults) {
      return
    }

    if (!getValues('company') && defaults.companies[0]?.name) {
      setValue('company', defaults.companies[0].name)
    }
  }, [defaults, getValues, setValue])

  useEffect(() => {
    if (!defaults || !company) {
      return
    }

    const currentPaidTo = getValues('paid_to')
    const paymentOptions = defaults.paymentAccounts.filter((account) => account.company === company)
    const fallbackPaidTo =
      selectedCompany?.default_bank_account ??
      selectedCompany?.default_cash_account ??
      paymentOptions[0]?.name ??
      ''

    if (!currentPaidTo || !paymentOptions.some((account) => account.name === currentPaidTo)) {
      setValue('paid_to', fallbackPaidTo)
    }
  }, [company, defaults, getValues, selectedCompany, setValue])

  useEffect(() => {
    if (!defaults || !company) {
      return
    }

    const currentPaidFrom = getValues('paid_from')
    const receivableOptions = defaults.receivableAccounts.filter((account) => account.company === company)
    const outstandingAccount = outstandingInvoicesQuery.data?.[0]?.debit_to
    const fallbackPaidFrom = outstandingAccount ?? selectedCompany?.default_receivable_account ?? receivableOptions[0]?.name ?? ''

    if (!currentPaidFrom || !receivableOptions.some((account) => account.name === currentPaidFrom)) {
      setValue('paid_from', fallbackPaidFrom)
    }
  }, [company, defaults, getValues, outstandingInvoicesQuery.data, selectedCompany, setValue])

  useEffect(() => {
    if (!company) {
      return
    }

    if (selectedCompany?.default_currency && sourceCurrency === selectedCompany.default_currency && getValues('source_exchange_rate') !== 1) {
      setValue('source_exchange_rate', 1)
    }

    if (selectedCompany?.default_currency && targetCurrency === selectedCompany.default_currency && getValues('target_exchange_rate') !== 1) {
      setValue('target_exchange_rate', 1)
    }

    if (sourceCurrency && targetCurrency && sourceCurrency === targetCurrency && getValues('target_exchange_rate') !== getValues('source_exchange_rate')) {
      setValue('target_exchange_rate', getValues('source_exchange_rate'))
    }
  }, [company, getValues, selectedCompany, setValue, sourceCurrency, targetCurrency])

  useEffect(() => {
    if (references.length > 0) {
      const nextPaidAmount = roundAmount(totalAllocatedAmount)

      if (nextPaidAmount !== getValues('paid_amount')) {
        setValue('paid_amount', nextPaidAmount)
      }

      const nextReceivedAmount = calculateReceivedAmount(nextPaidAmount, getValues('source_exchange_rate'), getValues('target_exchange_rate'))
      if (nextReceivedAmount !== getValues('received_amount')) {
        setValue('received_amount', nextReceivedAmount)
      }

      return
    }

    if (sourceCurrency && targetCurrency && sourceCurrency === targetCurrency) {
      const nextReceivedAmount = roundAmount(getValues('paid_amount'))
      if (nextReceivedAmount !== getValues('received_amount')) {
        setValue('received_amount', nextReceivedAmount)
      }
    }
  }, [getValues, references.length, setValue, sourceCurrency, targetCurrency, totalAllocatedAmount])

  useEffect(() => {
    if (references.length > 0) {
      const nextReceivedAmount = calculateReceivedAmount(getValues('paid_amount'), sourceExchangeRate, targetExchangeRate)
      if (nextReceivedAmount !== getValues('received_amount')) {
        setValue('received_amount', nextReceivedAmount)
      }
    }
  }, [getValues, references.length, setValue, sourceExchangeRate, targetExchangeRate])

  function addInvoiceReference(invoice: CollectionOutstandingInvoice) {
    const alreadySelected = references.some((reference) => reference.reference_name === invoice.name)
    if (alreadySelected) {
      return
    }

    append(createReferenceFromInvoice(invoice))

    if (invoice.debit_to && invoice.debit_to !== getValues('paid_from')) {
      setValue('paid_from', invoice.debit_to)
    }

    if (invoice.conversion_rate && invoice.currency && selectedCompany?.default_currency && invoice.currency !== selectedCompany.default_currency) {
      setValue('source_exchange_rate', invoice.conversion_rate)
    }
  }

  return (
    <form className="form-layout" onSubmit={handleSubmit(async (values) => onSubmit(values))}>
      <div className="form-header">
        <div>
          <p className="eyebrow">مستند محاسبي مبسط</p>
          <h3>{initialValues ? 'تعديل سند قبض' : 'إنشاء سند قبض'}</h3>
          <p>واجهة مبسطة فوق `Payment Entry` لتحصيل ديون العملاء أو تسجيل دفعات مقدمة مع الحفاظ على منطق ERPNext.</p>
        </div>
        <button className="button button-primary" disabled={disabled} type="submit">
          <Save size={17} aria-hidden="true" />
          {isSubmitting ? 'جاري الحفظ' : 'حفظ السند'}
        </button>
      </div>

      <div className="form-content">
        <div className="form-main">
          <section className="form-section">
            <div className="section-heading">
              <h4>رأس السند</h4>
              <p>نحدد الشركة والعميل وتاريخ السند والطريقة المحاسبية التي سيعتمدها ERPNext عند الحفظ والاعتماد.</p>
            </div>

            <div className="field-grid">
              <label className="field" htmlFor="collection-company">
                <span>الشركة</span>
                <input id="collection-company" list="collection-company-options" disabled={disabled} {...register('company')} />
                <datalist id="collection-company-options">
                  {(defaults?.companies ?? []).map((option) => (
                    <option key={option.name} value={option.name} />
                  ))}
                </datalist>
                {errors.company ? <small>{errors.company.message}</small> : null}
              </label>

              <label className="field" htmlFor="collection-posting-date">
                <span>تاريخ السند</span>
                <input id="collection-posting-date" disabled={disabled} type="date" {...register('posting_date')} />
                {errors.posting_date ? <small>{errors.posting_date.message}</small> : null}
              </label>

              <label className="field" htmlFor="collection-customer">
                <span>العميل</span>
                <LinkDatalistInput
                  id="collection-customer"
                  disabled={disabled}
                  doctype="Customer"
                  errorText={errors.customer?.message}
                  listId="collection-customer-options"
                  registration={register('customer')}
                />
              </label>

              <label className="field" htmlFor="collection-mode-of-payment">
                <span>طريقة الدفع</span>
                <input
                  id="collection-mode-of-payment"
                  list="collection-mode-of-payment-options"
                  disabled={disabled}
                  {...register('mode_of_payment')}
                />
                <datalist id="collection-mode-of-payment-options">
                  {(defaults?.modesOfPayment ?? []).map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading">
              <h4>الحسابات والمبالغ</h4>
              <p>المبلغ المحصل من العميل قد يختلف عن المبلغ الداخل للصندوق إذا كانت العملة مختلفة، لذا نظهر الحسابين وأسعار الصرف بوضوح.</p>
            </div>

            <div className="field-grid">
              <label className="field" htmlFor="collection-paid-from">
                <span>حساب الذمم من العميل</span>
                <input id="collection-paid-from" list="collection-receivable-account-options" disabled={disabled} {...register('paid_from')} />
                <datalist id="collection-receivable-account-options">
                  {receivableAccounts.map((option) => (
                    <option key={option.name} value={option.name} />
                  ))}
                </datalist>
                <em>{sourceCurrency ? `عملة الحساب: ${sourceCurrency}` : 'سيُحدد من حساب الذمم.'}</em>
                {errors.paid_from ? <small>{errors.paid_from.message}</small> : null}
              </label>

              <label className="field" htmlFor="collection-paid-to">
                <span>حساب التحصيل / الصندوق</span>
                <input id="collection-paid-to" list="collection-payment-account-options" disabled={disabled} {...register('paid_to')} />
                <datalist id="collection-payment-account-options">
                  {paymentAccounts.map((option) => (
                    <option key={option.name} value={option.name} />
                  ))}
                </datalist>
                <em>{targetCurrency ? `عملة الحساب: ${targetCurrency}` : 'سيُحدد من الحساب المستلم.'}</em>
                {errors.paid_to ? <small>{errors.paid_to.message}</small> : null}
              </label>

              <label className="field" htmlFor="collection-paid-amount">
                <span>المبلغ المحصل من العميل</span>
                <input
                  id="collection-paid-amount"
                  disabled={disabled || references.length > 0}
                  min="0.01"
                  step="0.01"
                  type="number"
                  {...register('paid_amount', {
                    setValueAs: (value) => (value === '' ? 0 : Number(value)),
                  })}
                />
                <em>{sourceCurrency || 'عملة الذمم'}</em>
                {errors.paid_amount ? <small>{errors.paid_amount.message}</small> : null}
              </label>

              <label className="field" htmlFor="collection-received-amount">
                <span>المبلغ الداخل إلى الصندوق</span>
                <input
                  id="collection-received-amount"
                  disabled={disabled || references.length > 0}
                  min="0.01"
                  step="0.01"
                  type="number"
                  {...register('received_amount', {
                    setValueAs: (value) => (value === '' ? 0 : Number(value)),
                  })}
                />
                <em>{targetCurrency || 'عملة الصندوق'}</em>
                {errors.received_amount ? <small>{errors.received_amount.message}</small> : null}
              </label>

              <label className="field" htmlFor="collection-source-exchange-rate">
                <span>سعر صرف العميل</span>
                <input
                  id="collection-source-exchange-rate"
                  disabled={disabled}
                  min="0.000001"
                  step="0.000001"
                  type="number"
                  {...register('source_exchange_rate', {
                    setValueAs: (value) => (value === '' ? 1 : Number(value)),
                  })}
                />
                {errors.source_exchange_rate ? <small>{errors.source_exchange_rate.message}</small> : null}
              </label>

              <label className="field" htmlFor="collection-target-exchange-rate">
                <span>سعر صرف الصندوق</span>
                <input
                  id="collection-target-exchange-rate"
                  disabled={disabled}
                  min="0.000001"
                  step="0.000001"
                  type="number"
                  {...register('target_exchange_rate', {
                    setValueAs: (value) => (value === '' ? 1 : Number(value)),
                  })}
                />
                {errors.target_exchange_rate ? <small>{errors.target_exchange_rate.message}</small> : null}
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading split">
              <div>
                <h4>الفواتير المفتوحة</h4>
                <p>اختر الفواتير التي تريد تحصيلها الآن. يمكن ترك هذا القسم فارغًا إذا كان السند دفعة مقدمة غير مرتبطة بفاتورة.</p>
              </div>
            </div>

            {outstandingInvoicesQuery.isError ? (
              <div className="inline-alert inline-alert-warning" role="alert">
                <span>{(outstandingInvoicesQuery.error as Error).message}</span>
              </div>
            ) : null}

            {customer && !outstandingInvoicesQuery.isLoading && availableInvoices.length === 0 ? (
              <div className="inline-alert inline-alert-warning" role="status">
                <span>لا توجد فواتير مفتوحة متاحة لهذا العميل حاليًا.</span>
              </div>
            ) : null}

            {availableInvoices.length > 0 ? (
              <div className="related-grid">
                {availableInvoices.map((invoice) => (
                  <article className="related-column" key={invoice.name}>
                    <h4>{invoice.name}</h4>
                    <p className="muted">
                      الاستحقاق: {formatDateTime(invoice.due_date)} | العملة: {invoice.currency || 'غير محدد'}
                    </p>
                    <strong>
                      المتبقي: {formatMoney(invoice.outstanding_amount)} {invoice.currency || ''}
                    </strong>
                    <span className="muted">إجمالي الفاتورة: {formatMoney(invoice.grand_total)}</span>
                    <button className="button button-secondary" disabled={disabled} type="button" onClick={() => addInvoiceReference(invoice)}>
                      <Plus size={16} aria-hidden="true" />
                      إضافة للتحصيل
                    </button>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <section className="form-section">
            <div className="section-heading split">
              <div>
                <h4>مراجع التحصيل</h4>
                <p>كل صف هنا يتحول إلى `Payment Entry Reference` داخل ERPNext، ويحدد كم تم تخصيصه لكل فاتورة.</p>
              </div>
            </div>

            {fields.length === 0 ? (
              <div className="inline-alert inline-alert-warning" role="status">
                <ArrowDownCircle size={18} aria-hidden="true" />
                <span>لا توجد فواتير مضافة بعد. يمكنك حفظ السند كدفعة مقدمة أو إضافة فاتورة مفتوحة من الأعلى.</span>
              </div>
            ) : null}

            <div className="line-items-section">
              {fields.map((field, index) => {
                const allocatedField = register(`references.${index}.allocated_amount`, {
                  setValueAs: (value) => (value === '' ? 0 : Number(value)),
                })

                return (
                  <article className="line-item-card" key={field.id}>
                    <div className="line-item-head">
                      <strong>{references[index]?.reference_name || `مرجع ${index + 1}`}</strong>
                      <div className="line-item-controls">
                        <button className="icon-button" disabled={disabled} title="حذف المرجع" type="button" onClick={() => remove(index)}>
                          <Trash2 size={16} aria-hidden="true" />
                          <span className="sr-only">حذف المرجع</span>
                        </button>
                      </div>
                    </div>

                    <div className="line-item-grid">
                      <label className="field" htmlFor={`references.${index}.reference_name`}>
                        <span>رقم الفاتورة</span>
                        <input id={`references.${index}.reference_name`} disabled readOnly {...register(`references.${index}.reference_name`)} />
                      </label>

                      <label className="field" htmlFor={`references.${index}.due_date`}>
                        <span>تاريخ الاستحقاق</span>
                        <input id={`references.${index}.due_date`} disabled readOnly {...register(`references.${index}.due_date`)} />
                      </label>

                      <label className="field" htmlFor={`references.${index}.outstanding_amount`}>
                        <span>المبلغ المتبقي</span>
                        <input id={`references.${index}.outstanding_amount`} disabled readOnly {...register(`references.${index}.outstanding_amount`)} />
                      </label>

                      <label className="field" htmlFor={`references.${index}.allocated_amount`}>
                        <span>المبلغ المخصص</span>
                        <input
                          id={`references.${index}.allocated_amount`}
                          disabled={disabled}
                          min="0.01"
                          step="0.01"
                          type="number"
                          {...allocatedField}
                        />
                        {errors.references?.[index]?.allocated_amount ? (
                          <small>{errors.references[index]?.allocated_amount?.message}</small>
                        ) : null}
                      </label>
                    </div>

                    <div className="line-item-foot">
                      <span>عملة الفاتورة</span>
                      <strong>{references[index]?.invoice_currency || sourceCurrency || 'غير محدد'}</strong>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading">
              <h4>معلومات إضافية</h4>
              <p>للمرجع البنكي أو الحوالة أو أي ملاحظة يحتاجها المحاسب عند المراجعة.</p>
            </div>

            <div className="field-grid">
              <label className="field" htmlFor="collection-reference-no">
                <span>رقم المرجع / الحوالة</span>
                <input id="collection-reference-no" disabled={disabled} {...register('reference_no')} />
              </label>

              <label className="field" htmlFor="collection-reference-date">
                <span>تاريخ المرجع</span>
                <input id="collection-reference-date" disabled={disabled} type="date" {...register('reference_date')} />
              </label>

              <label className="field field-wide" htmlFor="collection-remarks">
                <span>ملاحظات</span>
                <textarea id="collection-remarks" disabled={disabled} rows={3} {...register('remarks')} />
              </label>
            </div>
          </section>
        </div>

        <aside className="form-aside" aria-label="ملخص سند القبض">
          <p className="eyebrow">ملخص فوري</p>
          <h4>قراءة سريعة قبل الحفظ</h4>
          <ul>
            <li>عدد الفواتير المضافة: {references.length}</li>
            <li>
              إجمالي المخصص: {formatMoney(totalAllocatedAmount)} {sourceCurrency || ''}
            </li>
            <li>
              المبلغ المحصل: {formatMoney(paidAmount)} {sourceCurrency || ''}
            </li>
            <li>
              الداخل إلى الصندوق: {formatMoney(receivedAmount)} {targetCurrency || ''}
            </li>
            <li>
              القيمة المحسوبة بحسب الصرف: {formatMoney(calculatedReceivedAmount)} {targetCurrency || ''}
            </li>
          </ul>

          {differencePreview > 0.01 ? (
            <div className="inline-alert inline-alert-warning" role="alert">
              <span>يوجد فرق تقريبي قبل الاعتماد مقداره {formatMoney(differencePreview)}. راجع المبالغ أو أسعار الصرف.</span>
            </div>
          ) : null}

          <div className="inline-alert inline-alert-warning" role="note">
            <span>ERPNext سيعيد التحقق من الذمم والمراجع وسينشئ الأثر المحاسبي النهائي عند الحفظ والاعتماد.</span>
          </div>
        </aside>
      </div>
    </form>
  )
}

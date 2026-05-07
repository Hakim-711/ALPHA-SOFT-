import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownCircle, MinusCircle, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { LinkDatalistInput } from '@/shared/ui/link-datalist-input'
import { formatDateInputValue } from '@/shared/utils/date'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import {
  calculatePaidAmount,
  createReferenceFromPurchaseInvoice,
  roundAmount,
} from '../api/disbursements.api'
import { disbursementSchema, type DisbursementSchema } from '../schemas/disbursement.schema'
import { useDisbursementDefaults } from '../hooks/use-disbursement-defaults'
import { useOutstandingSupplierInvoices } from '../hooks/use-outstanding-supplier-invoices'
import type {
  DisbursementAccountOption,
  DisbursementCompanyOption,
  DisbursementFormValues,
  DisbursementOutstandingInvoice,
} from '../types/disbursement.types'

interface DisbursementFormProps {
  initialValues?: Partial<DisbursementFormValues>
  isSubmitting?: boolean
  readOnly?: boolean
  onSubmit: (values: DisbursementFormValues) => void | Promise<void>
}

function findAccountCurrency(accounts: DisbursementAccountOption[], accountName?: string) {
  if (!accountName) {
    return ''
  }

  return accounts.find((account) => account.name === accountName)?.account_currency ?? ''
}

function findCompany(companies: DisbursementCompanyOption[], companyName?: string) {
  return companies.find((company) => company.name === companyName)
}

export function DisbursementForm({
  initialValues,
  isSubmitting = false,
  readOnly = false,
  onSubmit,
}: DisbursementFormProps) {
  const defaultsQuery = useDisbursementDefaults()
  const {
    control,
    getValues,
    handleSubmit,
    register,
    setValue,
    formState: { errors },
  } = useForm<DisbursementSchema>({
    resolver: zodResolver(disbursementSchema),
    defaultValues: {
      company: initialValues?.company ?? '',
      posting_date: initialValues?.posting_date ?? formatDateInputValue(),
      supplier: initialValues?.supplier ?? '',
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
  const supplier = useWatch({ control, name: 'supplier' }) ?? ''
  const paidFrom = useWatch({ control, name: 'paid_from' }) ?? ''
  const paidTo = useWatch({ control, name: 'paid_to' }) ?? ''
  const paidAmount = Number(useWatch({ control, name: 'paid_amount' }) ?? 0)
  const receivedAmount = Number(useWatch({ control, name: 'received_amount' }) ?? 0)
  const sourceExchangeRate = Number(useWatch({ control, name: 'source_exchange_rate' }) ?? 1)
  const targetExchangeRate = Number(useWatch({ control, name: 'target_exchange_rate' }) ?? 1)
  const watchedReferences = useWatch({ control, name: 'references' })
  const outstandingInvoicesQuery = useOutstandingSupplierInvoices({
    supplier,
    company,
  })
  const defaults = defaultsQuery.data
  const disabled = isSubmitting || readOnly
  const references = useMemo(() => watchedReferences ?? [], [watchedReferences])
  const selectedCompany = useMemo(() => findCompany(defaults?.companies ?? [], company), [company, defaults?.companies])
  const paymentAccounts = useMemo(
    () => (defaults?.paymentAccounts ?? []).filter((account) => !company || account.company === company),
    [company, defaults?.paymentAccounts],
  )
  const payableAccounts = useMemo(
    () => (defaults?.payableAccounts ?? []).filter((account) => !company || account.company === company),
    [company, defaults?.payableAccounts],
  )
  const sourceCurrency = useMemo(
    () => findAccountCurrency(defaults?.paymentAccounts ?? [], paidFrom),
    [defaults?.paymentAccounts, paidFrom],
  )
  const targetCurrency = useMemo(
    () => findAccountCurrency(defaults?.payableAccounts ?? [], paidTo),
    [defaults?.payableAccounts, paidTo],
  )
  const totalAllocatedAmount = references.reduce((sum, reference) => sum + (Number(reference.allocated_amount) || 0), 0)
  const calculatedPaidAmount = calculatePaidAmount(receivedAmount, sourceExchangeRate, targetExchangeRate)
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

    const currentPaidFrom = getValues('paid_from')
    const paymentOptions = defaults.paymentAccounts.filter((account) => account.company === company)
    const fallbackPaidFrom =
      selectedCompany?.default_bank_account ??
      selectedCompany?.default_cash_account ??
      paymentOptions[0]?.name ??
      ''

    if (!currentPaidFrom || !paymentOptions.some((account) => account.name === currentPaidFrom)) {
      setValue('paid_from', fallbackPaidFrom)
    }
  }, [company, defaults, getValues, selectedCompany, setValue])

  useEffect(() => {
    if (!defaults || !company) {
      return
    }

    const currentPaidTo = getValues('paid_to')
    const payableOptions = defaults.payableAccounts.filter((account) => account.company === company)
    const outstandingAccount = outstandingInvoicesQuery.data?.[0]?.credit_to
    const fallbackPaidTo = outstandingAccount ?? selectedCompany?.default_payable_account ?? payableOptions[0]?.name ?? ''

    if (!currentPaidTo || !payableOptions.some((account) => account.name === currentPaidTo)) {
      setValue('paid_to', fallbackPaidTo)
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
      const nextReceivedAmount = roundAmount(totalAllocatedAmount)

      if (nextReceivedAmount !== getValues('received_amount')) {
        setValue('received_amount', nextReceivedAmount)
      }

      const nextPaidAmount = calculatePaidAmount(nextReceivedAmount, getValues('source_exchange_rate'), getValues('target_exchange_rate'))
      if (nextPaidAmount !== getValues('paid_amount')) {
        setValue('paid_amount', nextPaidAmount)
      }

      return
    }

    if (sourceCurrency && targetCurrency && sourceCurrency === targetCurrency) {
      const nextPaidAmount = roundAmount(getValues('received_amount'))
      if (nextPaidAmount !== getValues('paid_amount')) {
        setValue('paid_amount', nextPaidAmount)
      }
    }
  }, [getValues, references.length, setValue, sourceCurrency, targetCurrency, totalAllocatedAmount])

  useEffect(() => {
    if (references.length > 0) {
      const nextPaidAmount = calculatePaidAmount(getValues('received_amount'), sourceExchangeRate, targetExchangeRate)
      if (nextPaidAmount !== getValues('paid_amount')) {
        setValue('paid_amount', nextPaidAmount)
      }
    }
  }, [getValues, references.length, setValue, sourceExchangeRate, targetExchangeRate])

  function addInvoiceReference(invoice: DisbursementOutstandingInvoice) {
    const alreadySelected = references.some((reference) => reference.reference_name === invoice.name)
    if (alreadySelected) {
      return
    }

    append(createReferenceFromPurchaseInvoice(invoice))

    if (invoice.credit_to && invoice.credit_to !== getValues('paid_to')) {
      setValue('paid_to', invoice.credit_to)
    }

    if (invoice.conversion_rate && invoice.currency && selectedCompany?.default_currency && invoice.currency !== selectedCompany.default_currency) {
      setValue('target_exchange_rate', invoice.conversion_rate)
    }
  }

  return (
    <form className="form-layout" onSubmit={handleSubmit(async (values) => onSubmit(values))}>
      <div className="form-header">
        <div>
          <p className="eyebrow">مستند محاسبي مبسط</p>
          <h3>{initialValues ? 'تعديل سند صرف' : 'إنشاء سند صرف'}</h3>
          <p>واجهة مبسطة فوق `Payment Entry` لصرف مستحقات الموردين أو تسجيل دفعات مقدمة مع الحفاظ على منطق ERPNext.</p>
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
              <p>نحدد الشركة والمورد وتاريخ السند وطريقة الدفع قبل ربط السند بالفواتير المفتوحة أو حفظه كدفعة مقدمة.</p>
            </div>

            <div className="field-grid">
              <label className="field" htmlFor="disbursement-company">
                <span>الشركة</span>
                <input id="disbursement-company" list="disbursement-company-options" disabled={disabled} {...register('company')} />
                <datalist id="disbursement-company-options">
                  {(defaults?.companies ?? []).map((option) => (
                    <option key={option.name} value={option.name} />
                  ))}
                </datalist>
                {errors.company ? <small>{errors.company.message}</small> : null}
              </label>

              <label className="field" htmlFor="disbursement-posting-date">
                <span>تاريخ السند</span>
                <input id="disbursement-posting-date" disabled={disabled} type="date" {...register('posting_date')} />
                {errors.posting_date ? <small>{errors.posting_date.message}</small> : null}
              </label>

              <label className="field" htmlFor="disbursement-supplier">
                <span>المورد</span>
                <LinkDatalistInput
                  id="disbursement-supplier"
                  disabled={disabled}
                  doctype="Supplier"
                  errorText={errors.supplier?.message}
                  listId="disbursement-supplier-options"
                  registration={register('supplier')}
                />
              </label>

              <label className="field" htmlFor="disbursement-mode-of-payment">
                <span>طريقة الدفع</span>
                <input
                  id="disbursement-mode-of-payment"
                  list="disbursement-mode-of-payment-options"
                  disabled={disabled}
                  {...register('mode_of_payment')}
                />
                <datalist id="disbursement-mode-of-payment-options">
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
              <p>المبلغ الخارج من الصندوق قد يختلف عن المبلغ المسوى على ذمم المورد إذا كانت العملة مختلفة، لذلك نظهر الحسابين وأسعار الصرف بوضوح.</p>
            </div>

            <div className="field-grid">
              <label className="field" htmlFor="disbursement-paid-from">
                <span>حساب الصرف / الصندوق</span>
                <input id="disbursement-paid-from" list="disbursement-payment-account-options" disabled={disabled} {...register('paid_from')} />
                <datalist id="disbursement-payment-account-options">
                  {paymentAccounts.map((option) => (
                    <option key={option.name} value={option.name} />
                  ))}
                </datalist>
                <em>{sourceCurrency ? `عملة الحساب: ${sourceCurrency}` : 'سيحدد من حساب الصندوق.'}</em>
                {errors.paid_from ? <small>{errors.paid_from.message}</small> : null}
              </label>

              <label className="field" htmlFor="disbursement-paid-to">
                <span>حساب الدائنين / المورد</span>
                <input id="disbursement-paid-to" list="disbursement-payable-account-options" disabled={disabled} {...register('paid_to')} />
                <datalist id="disbursement-payable-account-options">
                  {payableAccounts.map((option) => (
                    <option key={option.name} value={option.name} />
                  ))}
                </datalist>
                <em>{targetCurrency ? `عملة الحساب: ${targetCurrency}` : 'سيحدد من حساب المورد.'}</em>
                {errors.paid_to ? <small>{errors.paid_to.message}</small> : null}
              </label>

              <label className="field" htmlFor="disbursement-paid-amount">
                <span>المبلغ الخارج من الصندوق</span>
                <input
                  id="disbursement-paid-amount"
                  disabled={disabled || references.length > 0}
                  min="0.01"
                  step="0.01"
                  type="number"
                  {...register('paid_amount', {
                    setValueAs: (value) => (value === '' ? 0 : Number(value)),
                  })}
                />
                <em>{sourceCurrency || 'عملة الصندوق'}</em>
                {errors.paid_amount ? <small>{errors.paid_amount.message}</small> : null}
              </label>

              <label className="field" htmlFor="disbursement-received-amount">
                <span>المبلغ المسوى على المورد</span>
                <input
                  id="disbursement-received-amount"
                  disabled={disabled || references.length > 0}
                  min="0.01"
                  step="0.01"
                  type="number"
                  {...register('received_amount', {
                    setValueAs: (value) => (value === '' ? 0 : Number(value)),
                  })}
                />
                <em>{targetCurrency || 'عملة المورد'}</em>
                {errors.received_amount ? <small>{errors.received_amount.message}</small> : null}
              </label>

              <label className="field" htmlFor="disbursement-source-exchange-rate">
                <span>سعر صرف الصندوق</span>
                <input
                  id="disbursement-source-exchange-rate"
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

              <label className="field" htmlFor="disbursement-target-exchange-rate">
                <span>سعر صرف المورد</span>
                <input
                  id="disbursement-target-exchange-rate"
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
                <h4>فواتير الشراء المفتوحة</h4>
                <p>اختر الفواتير التي تريد تسويتها الآن. يمكنك ترك هذا القسم فارغًا إذا كان السند دفعة مقدمة للمورد.</p>
              </div>
            </div>

            {outstandingInvoicesQuery.isError ? (
              <div className="inline-alert inline-alert-warning" role="alert">
                <span>{(outstandingInvoicesQuery.error as Error).message}</span>
              </div>
            ) : null}

            {supplier && !outstandingInvoicesQuery.isLoading && availableInvoices.length === 0 ? (
              <div className="inline-alert inline-alert-warning" role="status">
                <span>لا توجد فواتير شراء مفتوحة متاحة لهذا المورد حاليًا.</span>
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
                      إضافة للتسوية
                    </button>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <section className="form-section">
            <div className="section-heading split">
              <div>
                <h4>مراجع الصرف</h4>
                <p>كل صف هنا يتحول إلى `Payment Entry Reference` داخل ERPNext ويحدد كم تمت تسويته على كل فاتورة شراء.</p>
              </div>
            </div>

            {fields.length === 0 ? (
              <div className="inline-alert inline-alert-warning" role="status">
                <MinusCircle size={18} aria-hidden="true" />
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
                        <span>المبلغ المسوى</span>
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
                      <strong>{references[index]?.invoice_currency || targetCurrency || 'غير محدد'}</strong>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading">
              <h4>معلومات إضافية</h4>
              <p>للشيك أو التحويل أو أي ملاحظة يحتاجها المحاسب عند مراجعة سند الصرف.</p>
            </div>

            <div className="field-grid">
              <label className="field" htmlFor="disbursement-reference-no">
                <span>رقم المرجع / الحوالة</span>
                <input id="disbursement-reference-no" disabled={disabled} {...register('reference_no')} />
              </label>

              <label className="field" htmlFor="disbursement-reference-date">
                <span>تاريخ المرجع</span>
                <input id="disbursement-reference-date" disabled={disabled} type="date" {...register('reference_date')} />
              </label>

              <label className="field field-wide" htmlFor="disbursement-remarks">
                <span>ملاحظات</span>
                <textarea id="disbursement-remarks" disabled={disabled} rows={3} {...register('remarks')} />
              </label>
            </div>
          </section>
        </div>

        <aside className="form-aside" aria-label="ملخص سند الصرف">
          <p className="eyebrow">ملخص فوري</p>
          <h4>قراءة سريعة قبل الحفظ</h4>
          <ul>
            <li>عدد الفواتير المضافة: {references.length}</li>
            <li>
              إجمالي التسوية: {formatMoney(totalAllocatedAmount)} {targetCurrency || ''}
            </li>
            <li>
              الخارج من الصندوق: {formatMoney(paidAmount)} {sourceCurrency || ''}
            </li>
            <li>
              المسوى على المورد: {formatMoney(receivedAmount)} {targetCurrency || ''}
            </li>
            <li>
              القيمة المحسوبة بحسب الصرف: {formatMoney(calculatedPaidAmount)} {sourceCurrency || ''}
            </li>
          </ul>

          {differencePreview > 0.01 ? (
            <div className="inline-alert inline-alert-warning" role="alert">
              <span>يوجد فرق تقريبي قبل الاعتماد مقداره {formatMoney(differencePreview)}. راجع المبالغ أو أسعار الصرف.</span>
            </div>
          ) : null}

          <div className="inline-alert inline-alert-warning" role="note">
            <ArrowDownCircle size={18} aria-hidden="true" />
            <span>ERPNext سيعيد التحقق من الدائنين والمراجع وينشئ الأثر المحاسبي النهائي عند الحفظ والاعتماد.</span>
          </div>
        </aside>
      </div>
    </form>
  )
}

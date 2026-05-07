import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { LinkDatalistInput } from '@/shared/ui/link-datalist-input'
import { supplierSchema, type SupplierSchema } from '../schemas/supplier.schema'
import type { SupplierFormValues } from '../types/supplier.types'

interface SupplierFormProps {
  initialValues?: Partial<SupplierFormValues>
  isSubmitting?: boolean
  readOnly?: boolean
  onSubmit: (values: SupplierFormValues) => void | Promise<void>
}

export function SupplierForm({ initialValues, isSubmitting, readOnly = false, onSubmit }: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierSchema>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      supplier_name: initialValues?.supplier_name ?? '',
      supplier_type: initialValues?.supplier_type ?? 'Company',
      supplier_group: initialValues?.supplier_group ?? '',
      country: initialValues?.country ?? 'Yemen',
      default_currency: initialValues?.default_currency ?? '',
      payment_terms: initialValues?.payment_terms ?? '',
      website: initialValues?.website ?? '',
      mobile_no: initialValues?.mobile_no ?? '',
      email_id: initialValues?.email_id ?? '',
      tax_id: initialValues?.tax_id ?? '',
      address: initialValues?.address ?? '',
      supplier_details: initialValues?.supplier_details ?? '',
      disabled: initialValues?.disabled ?? false,
    },
  })

  const disabled = Boolean(isSubmitting || readOnly)

  return (
    <form className="form-layout" onSubmit={handleSubmit((values) => onSubmit(values))}>
      <div className="form-header">
        <div>
          <p className="eyebrow">بيانات المورد</p>
          <h3>{initialValues ? 'تعديل مورد' : 'إنشاء مورد'}</h3>
          <p>حافظ على بيانات المورد متوافقة مع ERPNext حتى تعمل فواتير الشراء والمدفوعات دون تضارب.</p>
        </div>
        <button className="button button-primary" disabled={disabled} type="submit">
          <Save size={17} aria-hidden="true" />
          {isSubmitting ? 'جاري الحفظ' : 'حفظ المورد'}
        </button>
      </div>

      <div className="form-content">
        <div className="form-main">
          <section className="form-section">
            <div className="section-heading">
              <h4>المعلومات الأساسية</h4>
              <p>الهوية الرئيسية للمورد التي ستستخدم في المشتريات وسندات الصرف.</p>
            </div>
            <div className="field-grid">
              <label className="field" htmlFor="supplier_name">
                <span>اسم المورد</span>
                <input
                  id="supplier_name"
                  aria-invalid={Boolean(errors.supplier_name)}
                  disabled={disabled}
                  {...register('supplier_name')}
                />
                {errors.supplier_name ? <small>{errors.supplier_name.message}</small> : null}
              </label>

              <label className="field" htmlFor="supplier_type">
                <span>نوع المورد</span>
                <select id="supplier_type" disabled={disabled} {...register('supplier_type')}>
                  <option value="Company">شركة</option>
                  <option value="Individual">فرد</option>
                </select>
                {errors.supplier_type ? <small>{errors.supplier_type.message}</small> : null}
              </label>

              <label className="field" htmlFor="supplier_group">
                <span>مجموعة الموردين</span>
                <LinkDatalistInput
                  id="supplier_group"
                  disabled={disabled}
                  doctype="Supplier Group"
                  helperText="رابط مجموعة الموردين في ERPNext"
                  listId="supplier-group-options"
                  registration={register('supplier_group')}
                />
              </label>

              <label className="field" htmlFor="country">
                <span>الدولة</span>
                <LinkDatalistInput
                  id="country"
                  disabled={disabled}
                  doctype="Country"
                  helperText="البلد الافتراضي للمورد"
                  listId="country-options"
                  registration={register('country')}
                />
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading">
              <h4>البيانات المالية</h4>
              <p>حقول تساعد على ضبط العملة وشروط الدفع في دورة المشتريات.</p>
            </div>
            <div className="field-grid">
              <label className="field" htmlFor="default_currency">
                <span>العملة الافتراضية</span>
                <LinkDatalistInput
                  id="default_currency"
                  disabled={disabled}
                  doctype="Currency"
                  helperText="العملة التي يفضّل المورد التعامل بها"
                  listId="supplier-currency-options"
                  registration={register('default_currency')}
                />
              </label>

              <label className="field" htmlFor="payment_terms">
                <span>شروط الدفع</span>
                <LinkDatalistInput
                  id="payment_terms"
                  disabled={disabled}
                  doctype="Payment Terms Template"
                  helperText="قالب شروط الدفع من ERPNext"
                  listId="payment-terms-options"
                  registration={register('payment_terms')}
                />
              </label>

              <label className="field" htmlFor="tax_id">
                <span>الرقم الضريبي</span>
                <input id="tax_id" disabled={disabled} {...register('tax_id')} />
              </label>

              <label className="field" htmlFor="website">
                <span>الموقع الإلكتروني</span>
                <input id="website" aria-invalid={Boolean(errors.website)} disabled={disabled} {...register('website')} />
                {errors.website ? <small>{errors.website.message}</small> : null}
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading">
              <h4>التواصل والملاحظات</h4>
              <p>تفاصيل عملية يستفيد منها المشتري والمحاسب أثناء إدخال الفواتير ومراجعة المدفوعات.</p>
            </div>
            <div className="field-grid">
              <label className="field" htmlFor="mobile_no">
                <span>الجوال</span>
                <input id="mobile_no" disabled={disabled} {...register('mobile_no')} />
              </label>

              <label className="field" htmlFor="email_id">
                <span>البريد الإلكتروني</span>
                <input id="email_id" aria-invalid={Boolean(errors.email_id)} disabled={disabled} {...register('email_id')} />
                {errors.email_id ? <small>{errors.email_id.message}</small> : null}
              </label>

              <label className="field field-wide" htmlFor="address">
                <span>العنوان الرئيسي</span>
                <LinkDatalistInput
                  id="address"
                  disabled={disabled}
                  doctype="Address"
                  helperText="رابط العنوان في ERPNext"
                  listId="supplier-address-options"
                  registration={register('address')}
                />
              </label>

              <label className="field field-wide" htmlFor="supplier_details">
                <span>ملاحظات</span>
                <textarea id="supplier_details" disabled={disabled} rows={3} {...register('supplier_details')} />
              </label>

              <label className="check-field">
                <input disabled={disabled} type="checkbox" {...register('disabled')} />
                <span>معطل</span>
              </label>
            </div>
          </section>
        </div>

        <aside className="form-aside" aria-label="Supplier rules">
          <p className="eyebrow">قواعد ERP</p>
          <h4>المورد جزء من دورة الشراء</h4>
          <ul>
            <li>يجب وجود المورد قبل فواتير الشراء أو سندات الصرف المرتبطة به.</li>
            <li>المورد المرتبط بمستندات شراء يفضل تعطيله بدل حذفه.</li>
            <li>العملة الافتراضية وشروط الدفع تساعد على تقليل أخطاء الإدخال في المشتريات.</li>
          </ul>
        </aside>
      </div>
    </form>
  )
}

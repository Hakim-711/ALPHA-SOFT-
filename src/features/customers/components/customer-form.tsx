import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { LinkDatalistInput } from '@/shared/ui/link-datalist-input'
import { customerSchema, type CustomerSchema } from '../schemas/customer.schema'
import type { CustomerFormValues } from '../types/customer.types'

interface CustomerFormProps {
  initialValues?: Partial<CustomerFormValues>
  isSubmitting?: boolean
  readOnly?: boolean
  onSubmit: (values: CustomerFormValues) => void | Promise<void>
}

export function CustomerForm({ initialValues, isSubmitting, readOnly = false, onSubmit }: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerSchema>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customer_name: initialValues?.customer_name ?? '',
      customer_type: initialValues?.customer_type ?? 'Individual',
      customer_group: initialValues?.customer_group ?? '',
      territory: initialValues?.territory ?? '',
      mobile_no: initialValues?.mobile_no ?? '',
      email_id: initialValues?.email_id ?? '',
      tax_id: initialValues?.tax_id ?? '',
      address: initialValues?.address ?? '',
      customer_details: initialValues?.customer_details ?? '',
      disabled: initialValues?.disabled ?? false,
    },
  })

  const disabled = Boolean(isSubmitting || readOnly)

  return (
    <form className="form-layout" onSubmit={handleSubmit((values) => onSubmit(values))}>
      <div className="form-header">
        <div>
          <p className="eyebrow">بيانات العميل</p>
          <h3>{initialValues ? 'تعديل عميل' : 'إنشاء عميل'}</h3>
          <p>حافظ على بيانات العميل متوافقة مع سجلات ERPNext ومستندات البيع المرتبطة.</p>
        </div>
        <button className="button button-primary" disabled={disabled} type="submit">
          <Save size={17} aria-hidden="true" />
          {isSubmitting ? 'جاري الحفظ' : 'حفظ العميل'}
        </button>
      </div>

      <div className="form-content">
        <div className="form-main">
          <section className="form-section">
            <div className="section-heading">
              <h4>المعلومات الأساسية</h4>
              <p>تصنيف رئيسي يستخدم في المبيعات والفواتير والتقارير.</p>
            </div>
            <div className="field-grid">
              <label className="field" htmlFor="customer_name">
                <span>اسم العميل</span>
                <input
                  id="customer_name"
                  aria-invalid={Boolean(errors.customer_name)}
                  disabled={disabled}
                  {...register('customer_name')}
                />
                {errors.customer_name ? <small>{errors.customer_name.message}</small> : null}
              </label>

              <label className="field" htmlFor="customer_type">
                <span>نوع العميل</span>
                <select id="customer_type" disabled={disabled} {...register('customer_type')}>
                  <option value="Individual">فرد</option>
                  <option value="Company">شركة</option>
                </select>
                {errors.customer_type ? <small>{errors.customer_type.message}</small> : null}
              </label>

              <label className="field" htmlFor="customer_group">
                <span>مجموعة العملاء</span>
                <LinkDatalistInput
                  id="customer_group"
                  disabled={disabled}
                  doctype="Customer Group"
                  helperText="رابط مجموعة العملاء في ERPNext"
                  listId="customer-group-options"
                  registration={register('customer_group')}
                />
              </label>

              <label className="field" htmlFor="territory">
                <span>المنطقة</span>
                <LinkDatalistInput
                  id="territory"
                  disabled={disabled}
                  doctype="Territory"
                  helperText="رابط المنطقة في ERPNext"
                  listId="territory-options"
                  registration={register('territory')}
                />
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading">
              <h4>بيانات التواصل</h4>
              <p>تفاصيل تشغيلية يستخدمها موظفو المبيعات والفوترة.</p>
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
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading">
              <h4>بيانات إضافية</h4>
              <p>حقول اختيارية تساعد في التقارير والتنقل بين المستندات المرتبطة.</p>
            </div>
            <div className="field-grid">
              <label className="field" htmlFor="tax_id">
                <span>الرقم الضريبي</span>
                <input id="tax_id" disabled={disabled} {...register('tax_id')} />
              </label>

              <label className="field field-wide" htmlFor="address">
                <span>العنوان الرئيسي</span>
                <LinkDatalistInput
                  id="address"
                  disabled={disabled}
                  doctype="Address"
                  helperText="رابط العنوان في ERPNext"
                  listId="address-options"
                  registration={register('address')}
                />
              </label>

              <label className="field field-wide" htmlFor="customer_details">
                <span>ملاحظات</span>
                <textarea id="customer_details" disabled={disabled} rows={3} {...register('customer_details')} />
              </label>

              <label className="check-field">
                <input disabled={disabled} type="checkbox" {...register('disabled')} />
                <span>معطل</span>
              </label>
            </div>
          </section>
        </div>

        <aside className="form-aside" aria-label="Customer rules">
          <p className="eyebrow">قواعد ERP</p>
          <h4>حقيقة البيانات تبقى في ERPNext</h4>
          <ul>
            <li>يجب إنشاء العميل قبل معاملات البيع.</li>
            <li>العملاء المرتبطون بمستندات يفضل تعطيلهم بدل حذفهم.</li>
            <li>المجموعات والمناطق والعناوين روابط حقيقية داخل ERPNext.</li>
          </ul>
        </aside>
      </div>
    </form>
  )
}

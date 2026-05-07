import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, Mail, Save, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { accountSchema, type AccountSchema } from '../schemas/account.schema'
import type { AccountFormValues, RoleOption } from '../types/account.types'

interface AccountFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<AccountFormValues>
  roleOptions: RoleOption[]
  isSubmitting?: boolean
  readOnly?: boolean
  onSubmit: (values: AccountFormValues) => void | Promise<void>
}

export function AccountForm({
  mode,
  initialValues,
  roleOptions,
  isSubmitting,
  readOnly = false,
  onSubmit,
}: AccountFormProps) {
  const [roleSearch, setRoleSearch] = useState('')
  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<AccountSchema>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email: initialValues?.email ?? '',
      first_name: initialValues?.first_name ?? '',
      last_name: initialValues?.last_name ?? '',
      username: initialValues?.username ?? '',
      mobile_no: initialValues?.mobile_no ?? '',
      user_type: initialValues?.user_type ?? 'System User',
      enabled: initialValues?.enabled ?? true,
      send_welcome_email: initialValues?.send_welcome_email ?? false,
      new_password: initialValues?.new_password ?? '',
      roles: initialValues?.roles ?? [],
    },
  })

  const disabled = Boolean(isSubmitting || readOnly)
  const selectedRoles = useWatch({
    control,
    name: 'roles',
  }) ?? []
  const userType = useWatch({
    control,
    name: 'user_type',
  })
  const filteredRoles = useMemo(() => {
    const trimmed = roleSearch.trim().toLowerCase()
    const pool = userType === 'System User' ? roleOptions.filter((role) => role.desk_access === 1) : roleOptions

    if (!trimmed) {
      return pool
    }

    return pool.filter((role) => role.name.toLowerCase().includes(trimmed))
  }, [roleOptions, roleSearch, userType])

  function toggleRole(roleName: string) {
    const nextRoles = selectedRoles.includes(roleName)
      ? selectedRoles.filter((role) => role !== roleName)
      : [...selectedRoles, roleName].sort((first, second) => first.localeCompare(second))

    setValue('roles', nextRoles, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  async function handleFormSubmit(values: AccountFormValues) {
    if (mode === 'create' && !values.new_password?.trim() && !values.send_welcome_email) {
      setError('new_password', {
        type: 'manual',
        message: 'أدخل كلمة مرور أولية أو فعّل إرسال رسالة الترحيب.',
      })
      return
    }

    await onSubmit(values)
  }

  return (
    <form className="form-layout" onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="form-header">
        <div>
          <p className="eyebrow">إدارة الحسابات والصلاحيات</p>
          <h3>{mode === 'create' ? 'إنشاء حساب جديد' : 'تحديث حساب موجود'}</h3>
          <p>الحسابات هنا هي مستندات User الفعلية في ERPNext، وإسناد الأدوار يحدد ما يراه المستخدم وما يستطيع تنفيذه.</p>
        </div>
        <button className="button button-primary" disabled={disabled} type="submit">
          <Save size={17} aria-hidden="true" />
          {isSubmitting ? 'جاري الحفظ' : mode === 'create' ? 'إنشاء الحساب' : 'حفظ التعديلات'}
        </button>
      </div>

      <div className="form-content">
        <div className="form-main">
          <section className="form-section">
            <div className="section-heading">
              <h4>بيانات الحساب</h4>
              <p>المعلومات الأساسية التي يعرف بها ERPNext المستخدم ويسمح له بتسجيل الدخول.</p>
            </div>
            <div className="field-grid">
              <label className="field" htmlFor="email">
                <span>البريد الإلكتروني</span>
                <input
                  id="email"
                  aria-invalid={Boolean(errors.email)}
                  disabled={disabled}
                  readOnly={mode === 'edit'}
                  type="email"
                  {...register('email')}
                />
                {errors.email ? (
                  <small>{errors.email.message}</small>
                ) : mode === 'edit' ? (
                  <em>معرّف الحساب الحالي محفوظ كما هو لتجنب إعادة تسمية المستخدم.</em>
                ) : null}
              </label>

              <label className="field" htmlFor="first_name">
                <span>الاسم الأول</span>
                <input
                  id="first_name"
                  aria-invalid={Boolean(errors.first_name)}
                  disabled={disabled}
                  {...register('first_name')}
                />
                {errors.first_name ? <small>{errors.first_name.message}</small> : null}
              </label>

              <label className="field" htmlFor="last_name">
                <span>اسم العائلة</span>
                <input id="last_name" aria-invalid={Boolean(errors.last_name)} disabled={disabled} {...register('last_name')} />
                {errors.last_name ? <small>{errors.last_name.message}</small> : null}
              </label>

              <label className="field" htmlFor="username">
                <span>اسم المستخدم</span>
                <input id="username" aria-invalid={Boolean(errors.username)} disabled={disabled} {...register('username')} />
                {errors.username ? <small>{errors.username.message}</small> : null}
              </label>

              <label className="field" htmlFor="mobile_no">
                <span>الجوال</span>
                <input id="mobile_no" aria-invalid={Boolean(errors.mobile_no)} disabled={disabled} {...register('mobile_no')} />
                {errors.mobile_no ? <small>{errors.mobile_no.message}</small> : null}
              </label>

              <label className="field" htmlFor="user_type">
                <span>نوع الحساب</span>
                <select id="user_type" disabled={disabled} {...register('user_type')}>
                  <option value="System User">مستخدم نظام</option>
                  <option value="Website User">مستخدم موقع</option>
                </select>
              </label>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading">
              <h4>الوصول والأمان</h4>
              <p>حدد ما إذا كان الحساب مفعّلًا وكيف سيتم تمكين صاحبه من الدخول لأول مرة أو عند إعادة الضبط.</p>
            </div>
            <div className="field-grid">
              <label className="field" htmlFor="new_password">
                <span>{mode === 'create' ? 'كلمة المرور الأولية' : 'كلمة مرور جديدة'}</span>
                <input
                  id="new_password"
                  aria-invalid={Boolean(errors.new_password)}
                  disabled={disabled}
                  type="password"
                  {...register('new_password')}
                />
                {errors.new_password ? (
                  <small>{errors.new_password.message}</small>
                ) : (
                  <em>{mode === 'create' ? 'ينصح بتحديد كلمة مرور مباشرة للحسابات الداخلية.' : 'اترك الحقل فارغًا إذا لم تكن تريد تغيير كلمة المرور.'}</em>
                )}
              </label>

              <div className="account-option-stack">
                <label className="check-field">
                  <input disabled={disabled} type="checkbox" {...register('enabled')} />
                  <span>الحساب مفعّل</span>
                </label>
                <label className="check-field">
                  <input disabled={disabled} type="checkbox" {...register('send_welcome_email')} />
                  <span>إرسال رسالة ترحيب من ERPNext</span>
                </label>
              </div>
            </div>
          </section>

          <section className="form-section">
            <div className="section-heading">
              <h4>الأدوار والصلاحيات</h4>
              <p>هذه الأدوار هي المصدر الحقيقي للصلاحيات. الواجهة ستقرأ أثرها تلقائيًا عند تسجيل المستخدم الدخول.</p>
            </div>

            <div className="role-panel">
              <div className="role-panel-head">
                <label className="search-box role-search">
                  <ShieldCheck size={17} aria-hidden="true" />
                  <input
                    disabled={disabled}
                    placeholder="ابحث داخل الأدوار"
                    value={roleSearch}
                    onChange={(event) => setRoleSearch(event.target.value)}
                  />
                </label>
                <div className="role-selection-summary">
                  <Mail size={16} aria-hidden="true" />
                  <span>{selectedRoles.length} دور محدد</span>
                </div>
              </div>

              {selectedRoles.length > 0 ? (
                <div className="selected-role-list" aria-label="الأدوار المحددة">
                  {selectedRoles.map((role) => (
                    <button
                      key={role}
                      className="selected-role-chip"
                      disabled={disabled}
                      type="button"
                      onClick={() => toggleRole(role)}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="role-grid" aria-label="قائمة الأدوار">
                {filteredRoles.map((role) => (
                  <label className="role-option" key={role.name}>
                    <input
                      checked={selectedRoles.includes(role.name)}
                      disabled={disabled}
                      type="checkbox"
                      onChange={() => toggleRole(role.name)}
                    />
                    <div>
                      <strong>{role.name}</strong>
                      <span>{role.desk_access === 1 ? 'وصول مكتبي' : 'وصول موقع / تكامل'}</span>
                    </div>
                  </label>
                ))}
              </div>
              {errors.roles ? <small className="roles-error">{errors.roles.message}</small> : null}
            </div>
          </section>
        </div>

        <aside className="form-aside" aria-label="Account rules">
          <p className="eyebrow">قواعد ERP</p>
          <h4>الصلاحيات تأتي من الأدوار</h4>
          <ul>
            <li>مستخدم النظام يحتاج عادةً أدوار Desk حتى يرى الواجهة الداخلية.</li>
            <li>إسناد دور المبيعات أو المشتريات أو الحسابات سيؤثر مباشرة على ما يظهر له في هذه الواجهة.</li>
            <li>تعطيل الحساب يمنع الدخول بدون حذف السجل أو فقدان أثره داخل ERPNext.</li>
          </ul>
          <div className="aside-note">
            <KeyRound size={16} aria-hidden="true" />
            <span>لضمان دخول سريع في البيئة المحلية، من الأفضل تعيين كلمة مرور مباشرة عند إنشاء الحسابات الداخلية.</span>
          </div>
        </aside>
      </div>
    </form>
  )
}

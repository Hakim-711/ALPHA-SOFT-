import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, CheckCircle2, LockKeyhole, LogIn, LogOut, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '../hooks/use-auth'

const loginSchema = z.object({
  username: z.string().trim().min(1, 'اسم المستخدم مطلوب'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
})

type LoginFormValues = z.infer<typeof loginSchema>

function resolveSafeReturnPath(state: unknown) {
  const fallback = '/dashboard'
  const from = (state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from
  const pathname = from?.pathname

  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//') || pathname.startsWith('/login')) {
    return fallback
  }

  return `${pathname}${from.search ?? ''}${from.hash ?? ''}`
}

export default function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const from = resolveSafeReturnPath(location.state)
  const loggedOut = useMemo(() => new URLSearchParams(location.search).get('logged_out') === '1', [location.search])
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  async function handleSignOutAndSwitchAccount() {
    setError(null)
    setIsSigningOut(true)

    try {
      await auth.logout()
    } catch {
      setError('تعذر إنهاء جلسة ERPNext من السيرفر، وسيتم إعادة فحص الجلسة عند فتح صفحة الدخول.')
    } finally {
      setIsSigningOut(false)
      window.location.replace('/login?logged_out=1')
    }
  }

  async function onSubmit(values: LoginFormValues) {
    setError(null)

    try {
      await auth.login(values)
      navigate(from, { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'فشل تسجيل الدخول')
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-brand">
          <div className="brand-mark">K</div>
          <div>
            <p className="brand-name">alpha-neqat</p>
            <p className="brand-subtitle">واجهة ERPNext المخصصة</p>
          </div>
        </div>

        <div className="auth-copy">
          <p className="eyebrow">دخول آمن للنظام</p>
          <h1>{auth.isAuthenticated ? 'الحساب الحالي داخل الجلسة' : 'سجّل الدخول للمتابعة'}</h1>
          <p>
            {auth.isAuthenticated
              ? 'أنت داخل النظام بالفعل. راجع اسم الحساب الحالي، ثم أكمل أو سجّل الخروج لتبديل الحساب.'
              : 'استخدم حساب ERPNext. الصلاحيات والأدوار والوصول للمستندات تبقى تحت تحكم السيرفر.'}
          </p>
        </div>

        {!auth.isAuthenticated && loggedOut ? (
          <div className="inline-alert inline-alert-success" role="status">
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>تم تسجيل الخروج بنجاح. يمكنك الآن الدخول بحساب آخر.</span>
          </div>
        ) : null}

        {auth.isAuthenticated ? (
          <div className="auth-form">
            {error ? (
              <div className="inline-alert" role="alert">
                <LockKeyhole size={18} aria-hidden="true" />
                <span>{error}</span>
              </div>
            ) : null}

            <div className="auth-session-card">
              <div className="auth-session-row">
                <span>الاسم الظاهر</span>
                <strong>{auth.user?.fullName ?? 'غير معروف'}</strong>
              </div>
              <div className="auth-session-row">
                <span>اسم الدخول</span>
                <strong>{auth.user?.name ?? 'غير معروف'}</strong>
              </div>
              <div className="auth-session-row">
                <span>عدد الأدوار</span>
                <strong>{auth.user?.roles?.length ?? 0}</strong>
              </div>
              <div className="auth-session-row">
                <span>المسار التالي</span>
                <strong>{from}</strong>
              </div>
            </div>

            <div className="auth-session-actions">
              <button className="button button-primary" type="button" onClick={() => navigate(from, { replace: true })}>
                <ArrowRight size={17} aria-hidden="true" />
                متابعة إلى النظام
              </button>
              <button
                className="button button-secondary"
                disabled={isSigningOut}
                type="button"
                onClick={handleSignOutAndSwitchAccount}
              >
                <LogOut size={17} aria-hidden="true" />
                {isSigningOut ? 'جاري تسجيل الخروج' : 'تسجيل الخروج واستخدام حساب آخر'}
              </button>
            </div>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
            {error ? (
              <div className="inline-alert" role="alert">
                <LockKeyhole size={18} aria-hidden="true" />
                <span>{error}</span>
              </div>
            ) : null}

            <label className="field" htmlFor="username">
              <span>اسم المستخدم أو البريد</span>
              <input id="username" autoComplete="username" aria-invalid={Boolean(errors.username)} {...register('username')} />
              {errors.username ? <small>{errors.username.message}</small> : null}
            </label>

            <label className="field" htmlFor="password">
              <span>كلمة المرور</span>
              <input
                id="password"
                autoComplete="current-password"
                type="password"
                aria-invalid={Boolean(errors.password)}
                {...register('password')}
              />
              {errors.password ? <small>{errors.password.message}</small> : null}
            </label>

            <button className="button button-primary" disabled={isSubmitting} type="submit">
              <LogIn size={17} aria-hidden="true" />
              {isSubmitting ? 'جاري الدخول' : 'تسجيل الدخول'}
            </button>
          </form>
        )}
      </section>

      <aside className="auth-trust-panel">
        <ShieldCheck size={34} aria-hidden="true" />
        <h2>ERPNext يبقى مصدر الحقيقة</h2>
        <p>المصادقة والصلاحيات والتحقق وسير العمل وحالات المستندات يتم فرضها من ERPNext.</p>
      </aside>
    </main>
  )
}

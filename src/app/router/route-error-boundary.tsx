import { AlertTriangle, Home, RotateCcw } from 'lucide-react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'

function resolveRouteErrorMessage(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return `${error.status} - ${error.statusText || 'تعذر فتح الصفحة المطلوبة'}`
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'حدث خطأ غير متوقع أثناء فتح الصفحة.'
}

export function RouteErrorBoundary() {
  const error = useRouteError()
  const message = resolveRouteErrorMessage(error)

  return (
    <main className="route-loading" dir="rtl">
      <section className="state-block state-error" role="alert">
        <div className="state-heading">
          <AlertTriangle size={24} aria-hidden="true" />
          <div>
            <h3>تعذر عرض هذه الصفحة</h3>
            <p>{message}</p>
          </div>
        </div>

        <div className="auth-session-actions">
          <button className="button button-secondary" type="button" onClick={() => window.location.reload()}>
            <RotateCcw size={16} aria-hidden="true" />
            إعادة المحاولة
          </button>
          <Link className="button button-primary" to="/dashboard">
            <Home size={16} aria-hidden="true" />
            العودة للوحة التحكم
          </Link>
        </div>
      </section>
    </main>
  )
}

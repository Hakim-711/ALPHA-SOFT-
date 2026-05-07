import { AlertTriangle } from 'lucide-react'

interface ErrorStateProps {
  message?: string
}

export function ErrorState({ message = 'حدث خطأ غير متوقع.' }: ErrorStateProps) {
  return (
    <div className="state-block state-error" role="alert">
      <div className="state-heading">
        <AlertTriangle size={22} aria-hidden="true" />
        <div>
          <h3>تعذر إكمال الطلب</h3>
          <p>{message}</p>
        </div>
      </div>
    </div>
  )
}

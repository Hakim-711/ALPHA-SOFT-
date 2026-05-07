import { Loader2 } from 'lucide-react'
import { SkeletonTable } from './skeleton'

export function Loading() {
  return (
    <div className="state-block state-loading">
      <div className="state-heading">
        <Loader2 size={22} aria-hidden="true" />
        <div>
          <h3>جاري التحميل</h3>
          <p>يرجى الانتظار حتى يستجيب ERPNext.</p>
        </div>
      </div>
      <SkeletonTable rows={4} />
    </div>
  )
}

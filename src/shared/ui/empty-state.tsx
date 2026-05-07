import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  message?: string
  action?: ReactNode
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="state-block">
      <div className="state-heading">
        <Inbox size={22} aria-hidden="true" />
        <div>
          <h3>{title}</h3>
          {message ? <p>{message}</p> : null}
        </div>
      </div>
      {action ? <div className="state-action">{action}</div> : null}
    </div>
  )
}

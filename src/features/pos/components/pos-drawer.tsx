import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface PosDrawerProps {
  ariaLabel: string
  eyebrow: string
  title: string
  doneLabel?: string
  children: ReactNode
  onClose: () => void
}

export function PosDrawer({
  ariaLabel,
  eyebrow,
  title,
  doneLabel = 'حفظ والعودة للكاشير',
  children,
  onClose,
}: PosDrawerProps) {
  return (
    <div className="pos-drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        aria-label={ariaLabel}
        aria-modal="true"
        className="pos-sale-details-drawer"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="pos-drawer-header">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h3>{title}</h3>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {children}

        <button className="button button-primary pos-drawer-done" type="button" onClick={onClose}>
          {doneLabel}
        </button>
      </aside>
    </div>
  )
}

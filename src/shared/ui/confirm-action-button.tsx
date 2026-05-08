import { AlertTriangle } from 'lucide-react'
import { type ReactNode, useState } from 'react'

interface ConfirmActionButtonProps {
  cancelLabel?: string
  children: ReactNode
  className: string
  confirmActionLabel: string
  confirmMessage: string
  confirmTitle: string
  disabled?: boolean
  onConfirm: () => void
}

export function ConfirmActionButton({
  cancelLabel = 'رجوع',
  children,
  className,
  confirmActionLabel,
  confirmMessage,
  confirmTitle,
  disabled,
  onConfirm,
}: ConfirmActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  function handleConfirm() {
    setIsOpen(false)
    onConfirm()
  }

  return (
    <>
      <button className={className} disabled={disabled} type="button" onClick={() => setIsOpen(true)}>
        {children}
      </button>

      {isOpen ? (
        <div className="confirm-action-backdrop" role="presentation" onMouseDown={() => setIsOpen(false)}>
          <div
            aria-modal="true"
            className="confirm-action-dialog"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="confirm-action-icon">
              <AlertTriangle size={24} aria-hidden="true" />
            </div>
            <div>
              <p className="eyebrow">تأكيد إجراء حساس</p>
              <h3>{confirmTitle}</h3>
              <p>{confirmMessage}</p>
            </div>

            <div className="confirm-action-actions">
              <button className="button button-secondary" type="button" onClick={() => setIsOpen(false)}>
                {cancelLabel}
              </button>
              <button className="button button-primary" type="button" onClick={handleConfirm}>
                {confirmActionLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

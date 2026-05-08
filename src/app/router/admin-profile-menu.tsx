import { ChevronDown, LogOut } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface AdminProfileMenuProps {
  avatarLabel: string
  currentIdentity: string
  displayName: string
  extraRolesCount: number
  isLoggingOut: boolean
  isOpen: boolean
  primaryRoles: string[]
  onClose: () => void
  onLogout: () => void | Promise<void>
  onOpenSessionPage: () => void
  onToggle: () => void
}

export function AdminProfileMenu({
  avatarLabel,
  currentIdentity,
  displayName,
  extraRolesCount,
  isLoggingOut,
  isOpen,
  onClose,
  onLogout,
  onOpenSessionPage,
  onToggle,
  primaryRoles,
}: AdminProfileMenuProps) {
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    function handlePointerDown(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  return (
    <div className="profile-menu-shell" ref={profileMenuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="profile-button"
        title={`الحساب الحالي: ${displayName} (${currentIdentity})`}
        type="button"
        onClick={onToggle}
      >
        <span className="avatar">{avatarLabel}</span>
        <span className="profile-copy">
          <strong>{displayName}</strong>
          <small>{currentIdentity}</small>
        </span>
        <ChevronDown className={isOpen ? 'chevron-open' : undefined} size={15} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="profile-menu" role="menu">
          <div className="profile-menu-head">
            <strong>{displayName}</strong>
            <span>{currentIdentity}</span>
          </div>

          <div className="profile-menu-section">
            <p>الأدوار الحالية</p>
            <div className="profile-role-list">
              {primaryRoles.length > 0 ? (
                primaryRoles.map((role) => (
                  <span className="badge badge-neutral" key={role}>
                    {role}
                  </span>
                ))
              ) : (
                <span className="profile-menu-empty">لا توجد أدوار ظاهرة</span>
              )}
              {extraRolesCount > 0 ? <span className="badge badge-blue">+{extraRolesCount}</span> : null}
            </div>
          </div>

          <div className="profile-menu-actions">
            <button className="button button-secondary" type="button" onClick={onOpenSessionPage}>
              إدارة الجلسة
            </button>
            <button className="button button-secondary" disabled={isLoggingOut} type="button" onClick={onLogout}>
              <LogOut size={16} aria-hidden="true" />
              {isLoggingOut ? 'جاري تسجيل الخروج' : 'تسجيل الخروج'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

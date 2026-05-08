import { Bell, LogOut, ScanBarcode } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import type { GlobalSearchPermissions } from '@/features/global-search/api/global-search.api'
import { GlobalSearch } from '@/features/global-search/components/global-search'
import { AdminProfileMenu } from './admin-profile-menu'
import type { TopbarCopy } from './topbar-copy'

interface AdminTopbarProps {
  avatarLabel: string
  canOpenPos: boolean
  currentIdentity: string
  displayName: string
  extraRolesCount: number
  globalSearchPermissions: GlobalSearchPermissions
  isLoggingOut: boolean
  isProfileMenuOpen: boolean
  primaryRoles: string[]
  searchKey: string
  topbarCopy: TopbarCopy
  onCloseProfileMenu: () => void
  onLogout: () => void | Promise<void>
  onOpenSessionPage: () => void
  onToggleProfileMenu: () => void
}

export function AdminTopbar({
  avatarLabel,
  canOpenPos,
  currentIdentity,
  displayName,
  extraRolesCount,
  globalSearchPermissions,
  isLoggingOut,
  isProfileMenuOpen,
  onCloseProfileMenu,
  onLogout,
  onOpenSessionPage,
  onToggleProfileMenu,
  primaryRoles,
  searchKey,
  topbarCopy,
}: AdminTopbarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">{topbarCopy.eyebrow}</p>
        <h1>{topbarCopy.title}</h1>
      </div>

      {canOpenPos ? (
        <NavLink
          className={({ isActive }) => (isActive ? 'topbar-pos-button active' : 'topbar-pos-button')}
          to="/pos"
        >
          <ScanBarcode size={19} aria-hidden="true" />
          <span>نقطة البيع</span>
        </NavLink>
      ) : null}

      <GlobalSearch key={searchKey} permissions={globalSearchPermissions} />

      <div className="topbar-actions">
        <div className="connection-pill">
          <span />
          اتصال ERPNext
        </div>

        <button className="icon-button elevated" disabled title="الإشعارات قريبًا" type="button">
          <Bell size={17} aria-hidden="true" />
          <span className="sr-only">الإشعارات قريبًا</span>
        </button>

        <button className="button button-secondary topbar-logout-button" disabled={isLoggingOut} type="button" onClick={onLogout}>
          <LogOut size={16} aria-hidden="true" />
          {isLoggingOut ? 'جاري تسجيل الخروج' : 'تسجيل الخروج'}
        </button>

        <AdminProfileMenu
          avatarLabel={avatarLabel}
          currentIdentity={currentIdentity}
          displayName={displayName}
          extraRolesCount={extraRolesCount}
          isLoggingOut={isLoggingOut}
          isOpen={isProfileMenuOpen}
          primaryRoles={primaryRoles}
          onClose={onCloseProfileMenu}
          onLogout={onLogout}
          onOpenSessionPage={onOpenSessionPage}
          onToggle={onToggleProfileMenu}
        />
      </div>
    </header>
  )
}

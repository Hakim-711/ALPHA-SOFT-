import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { AdminSidebar } from './admin-sidebar'
import { AdminTopbar } from './admin-topbar'
import { resolveTopbarCopy } from './topbar-copy'
import { useAdminNavigationPermissions } from './use-admin-navigation-permissions'

export function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const topbarCopy = resolveTopbarCopy(location.pathname)
  const displayName = auth.user?.fullName ?? 'المدير'
  const currentIdentity = auth.user?.name ?? auth.user?.email ?? 'unknown'
  const avatarLabel = displayName.slice(0, 1).toUpperCase()
  const primaryRoles = auth.user?.roles?.slice(0, 4) ?? []
  const extraRolesCount = Math.max((auth.user?.roles?.length ?? 0) - primaryRoles.length, 0)
  const { canOpenPos, globalSearchPermissions, visibleNavItems } = useAdminNavigationPermissions()

  async function handleLogout() {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)

    try {
      await auth.logout()
    } catch {
      // Keep logout usable even if the ERPNext logout request fails; the next login will re-check the server session.
    } finally {
      setIsProfileMenuOpen(false)
      setIsLoggingOut(false)
      window.location.replace('/login?logged_out=1')
    }
  }

  function handleOpenSessionPage() {
    setIsProfileMenuOpen(false)
    navigate('/login')
  }

  return (
    <div className={isCollapsed ? 'app-shell shell-collapsed' : 'app-shell'}>
      <AdminSidebar
        isCollapsed={isCollapsed}
        visibleNavItems={visibleNavItems}
        onToggleCollapse={() => setIsCollapsed((current) => !current)}
      />

      <div className="workspace">
        <AdminTopbar
          avatarLabel={avatarLabel}
          canOpenPos={canOpenPos}
          currentIdentity={currentIdentity}
          displayName={displayName}
          extraRolesCount={extraRolesCount}
          globalSearchPermissions={globalSearchPermissions}
          isLoggingOut={isLoggingOut}
          isProfileMenuOpen={isProfileMenuOpen}
          primaryRoles={primaryRoles}
          searchKey={`${location.pathname}${location.search}`}
          topbarCopy={topbarCopy}
          onCloseProfileMenu={() => setIsProfileMenuOpen(false)}
          onLogout={handleLogout}
          onOpenSessionPage={handleOpenSessionPage}
          onToggleProfileMenu={() => setIsProfileMenuOpen((current) => !current)}
        />

        <main className={location.pathname.startsWith('/pos') ? 'content content-pos-mode' : 'content'}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

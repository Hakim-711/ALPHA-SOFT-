import {
  Bell,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ScanBarcode,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { GlobalSearch } from '@/features/global-search/components/global-search'
import { navSections } from './navigation'
import { resolveTopbarCopy } from './topbar-copy'
import { useAdminNavigationPermissions } from './use-admin-navigation-permissions'

export function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const auth = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const CollapseIcon = isCollapsed ? PanelLeftOpen : PanelLeftClose
  const topbarCopy = resolveTopbarCopy(location.pathname)
  const currentIdentity = auth.user?.name ?? auth.user?.email ?? 'unknown'
  const primaryRoles = auth.user?.roles?.slice(0, 4) ?? []
  const extraRolesCount = Math.max((auth.user?.roles?.length ?? 0) - primaryRoles.length, 0)
  const { canOpenPos, globalSearchPermissions, visibleNavItems } = useAdminNavigationPermissions()

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined
    }

    function handlePointerDown(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isProfileMenuOpen])

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

  function toggleProfileMenu() {
    setIsProfileMenuOpen((current) => !current)
  }

  return (
    <div className={isCollapsed ? 'app-shell shell-collapsed' : 'app-shell'}>
      <aside className="sidebar" aria-label="التنقل الرئيسي">
        <div className="brand-block">
          <div className="brand-mark">K</div>
          <div className="brand-copy">
            <p className="brand-name">alpha-neqat</p>
            <p className="brand-subtitle">واجهة ERPNext</p>
          </div>
          <button
            className="sidebar-toggle"
            title={isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
            type="button"
            onClick={() => setIsCollapsed((current) => !current)}
          >
            <CollapseIcon size={17} aria-hidden="true" />
            <span className="sr-only">{isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}</span>
          </button>
        </div>

        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div className="nav-section" key={section}>
              <p>{section}</p>
              {visibleNavItems
                .filter((item) => item.section === section)
                .map((item) => {
                  const Icon = item.icon

                  if (!item.enabled) {
                    return (
                      <span className="nav-item nav-item-disabled" key={item.label}>
                        <Icon size={18} aria-hidden="true" />
                        <span className="nav-label">{item.label}</span>
                        <span className="nav-soon">قريبًا</span>
                      </span>
                    )
                  }

                  return (
                    <NavLink className="nav-item" key={item.label} to={item.path}>
                      <Icon size={18} aria-hidden="true" />
                      <span className="nav-label">{item.label}</span>
                    </NavLink>
                  )
                })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <ShieldCheck size={18} aria-hidden="true" />
          <div>
            <strong>ERPNext هو المصدر</strong>
            <span>منطق السيرفر محفوظ</span>
          </div>
        </div>
      </aside>

      <div className="workspace">
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

          <GlobalSearch
            key={`${location.pathname}${location.search}`}
            permissions={globalSearchPermissions}
          />

          <div className="topbar-actions">
            <div className="connection-pill">
              <span />
              اتصال ERPNext
            </div>

            <button className="icon-button elevated" disabled title="الإشعارات قريبًا" type="button">
              <Bell size={17} aria-hidden="true" />
              <span className="sr-only">الإشعارات قريبًا</span>
            </button>

            <button
              className="button button-secondary topbar-logout-button"
              disabled={isLoggingOut}
              type="button"
              onClick={handleLogout}
            >
              <LogOut size={16} aria-hidden="true" />
              {isLoggingOut ? 'جاري تسجيل الخروج' : 'تسجيل الخروج'}
            </button>

            <div className="profile-menu-shell" ref={profileMenuRef}>
              <button
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="menu"
                className="profile-button"
                title={`الحساب الحالي: ${auth.user?.fullName ?? 'غير معروف'} (${currentIdentity})`}
                type="button"
                onClick={toggleProfileMenu}
              >
                <span className="avatar">{auth.user?.fullName?.slice(0, 1).toUpperCase() ?? 'A'}</span>
                <span className="profile-copy">
                  <strong>{auth.user?.fullName ?? 'المدير'}</strong>
                  <small>{currentIdentity}</small>
                </span>
                <ChevronDown className={isProfileMenuOpen ? 'chevron-open' : undefined} size={15} aria-hidden="true" />
              </button>

              {isProfileMenuOpen ? (
                <div className="profile-menu" role="menu">
                  <div className="profile-menu-head">
                    <strong>{auth.user?.fullName ?? 'غير معروف'}</strong>
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
                    <button className="button button-secondary" type="button" onClick={handleOpenSessionPage}>
                      إدارة الجلسة
                    </button>
                    <button className="button button-secondary" disabled={isLoggingOut} type="button" onClick={handleLogout}>
                      <LogOut size={16} aria-hidden="true" />
                      {isLoggingOut ? 'جاري تسجيل الخروج' : 'تسجيل الخروج'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className={location.pathname.startsWith('/pos') ? 'content content-pos-mode' : 'content'}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { PanelLeftClose, PanelLeftOpen, ShieldCheck } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { navSections, type NavItem } from './navigation'

interface AdminSidebarProps {
  isCollapsed: boolean
  visibleNavItems: readonly NavItem[]
  onToggleCollapse: () => void
}

export function AdminSidebar({ isCollapsed, visibleNavItems, onToggleCollapse }: AdminSidebarProps) {
  const CollapseIcon = isCollapsed ? PanelLeftOpen : PanelLeftClose
  const toggleLabel = isCollapsed ? 'توسيع القائمة' : 'طي القائمة'

  return (
    <aside className="sidebar" aria-label="التنقل الرئيسي">
      <div className="brand-block">
        <div className="brand-mark">K</div>
        <div className="brand-copy">
          <p className="brand-name">alpha-neqat</p>
          <p className="brand-subtitle">واجهة ERPNext</p>
        </div>
        <button className="sidebar-toggle" title={toggleLabel} type="button" onClick={onToggleCollapse}>
          <CollapseIcon size={17} aria-hidden="true" />
          <span className="sr-only">{toggleLabel}</span>
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
  )
}

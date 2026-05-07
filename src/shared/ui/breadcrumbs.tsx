import { ChevronLeft, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

interface BreadcrumbItem {
  label: string
  to?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumbs" aria-label="مسار الصفحة">
      <Link className="breadcrumb-home" to="/dashboard" title="الرئيسية">
        <Home size={15} aria-hidden="true" />
        <span className="sr-only">الرئيسية</span>
      </Link>
      {items.map((item) => (
        <span className="breadcrumb-item" key={`${item.label}-${item.to ?? 'current'}`}>
          <ChevronLeft size={14} aria-hidden="true" />
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
  )
}

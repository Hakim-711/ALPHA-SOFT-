import type { PropsWithChildren, ReactNode } from 'react'

interface PageHeaderProps extends PropsWithChildren {
  title: string
  subtitle?: string
  actions?: ReactNode
  eyebrow?: string
  meta?: ReactNode
}

export function PageHeader({ title, subtitle, actions, eyebrow, meta, children }: PageHeaderProps) {
  return (
    <section className="page-header">
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
        {meta ? <div className="page-meta">{meta}</div> : null}
        {children}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </section>
  )
}

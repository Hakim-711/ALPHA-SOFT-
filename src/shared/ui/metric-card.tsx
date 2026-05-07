import type { ComponentType } from 'react'
import type { LucideProps } from 'lucide-react'
import { Badge } from './badge'

interface MetricCardProps {
  label: string
  value: string | number
  detail: string
  icon: ComponentType<LucideProps>
  tone?: 'green' | 'blue' | 'amber' | 'red' | 'neutral'
}

export function MetricCard({ label, value, detail, icon: Icon, tone = 'neutral' }: MetricCardProps) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <div className="metric-icon">
        <Icon size={19} aria-hidden="true" />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <Badge tone={tone === 'neutral' ? 'neutral' : tone}>{detail}</Badge>
      </div>
    </article>
  )
}


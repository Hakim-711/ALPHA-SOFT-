import type { PropsWithChildren } from 'react'
import { cn } from '@/core/utils/cn'

type BadgeTone = 'neutral' | 'green' | 'amber' | 'red' | 'blue'

interface BadgeProps extends PropsWithChildren {
  tone?: BadgeTone
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return <span className={cn('badge', `badge-${tone}`)}>{children}</span>
}


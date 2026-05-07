import { Badge } from '@/shared/ui/badge'
import type { AccountRecord } from '../types/account.types'

interface AccountTypeBadgeProps {
  account: AccountRecord
}

export function AccountTypeBadge({ account }: AccountTypeBadgeProps) {
  return account.user_type === 'Website User' ? <Badge tone="amber">موقع</Badge> : <Badge tone="blue">نظام</Badge>
}

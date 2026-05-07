import { Badge } from '@/shared/ui/badge'
import type { AccountRecord } from '../types/account.types'

interface AccountStatusBadgeProps {
  account: AccountRecord
}

export function AccountStatusBadge({ account }: AccountStatusBadgeProps) {
  return account.enabled === 0 ? <Badge tone="red">معطل</Badge> : <Badge tone="green">مفعل</Badge>
}

import { Badge } from '@/shared/ui/badge'
import type { Customer } from '../types/customer.types'

interface CustomerStatusBadgeProps {
  customer: Pick<Customer, 'disabled'>
}

export function CustomerStatusBadge({ customer }: CustomerStatusBadgeProps) {
  return customer.disabled ? <Badge tone="red">معطل</Badge> : <Badge tone="green">نشط</Badge>
}

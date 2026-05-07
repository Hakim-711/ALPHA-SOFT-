import { Badge } from '@/shared/ui/badge'
import type { Customer } from '../types/customer.types'

interface CustomerTypeBadgeProps {
  type: Customer['customer_type']
}

export function CustomerTypeBadge({ type }: CustomerTypeBadgeProps) {
  const label = type === 'Company' ? 'شركة' : type === 'Individual' ? 'فرد' : 'غير محدد'

  return <Badge tone={type === 'Company' ? 'blue' : 'neutral'}>{label}</Badge>
}

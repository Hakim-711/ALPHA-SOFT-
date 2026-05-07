import { Badge } from '@/shared/ui/badge'
import type { Supplier } from '../types/supplier.types'

interface SupplierTypeBadgeProps {
  type: Supplier['supplier_type']
}

export function SupplierTypeBadge({ type }: SupplierTypeBadgeProps) {
  const label = type === 'Company' ? 'شركة' : type === 'Individual' ? 'فرد' : 'غير محدد'

  return <Badge tone={type === 'Company' ? 'blue' : 'neutral'}>{label}</Badge>
}

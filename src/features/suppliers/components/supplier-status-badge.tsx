import { Badge } from '@/shared/ui/badge'
import type { Supplier } from '../types/supplier.types'

interface SupplierStatusBadgeProps {
  supplier: Pick<Supplier, 'disabled'>
}

export function SupplierStatusBadge({ supplier }: SupplierStatusBadgeProps) {
  return supplier.disabled ? <Badge tone="red">معطل</Badge> : <Badge tone="green">نشط</Badge>
}

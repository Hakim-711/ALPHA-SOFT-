import { Badge } from '@/shared/ui/badge'
import type { StockEntryPurpose } from '../types/stock.types'

const purposeLabels: Record<string, string> = {
  'Material Receipt': 'استلام مواد',
  'Material Issue': 'صرف مواد',
  'Material Transfer': 'تحويل مواد',
  Repack: 'إعادة تعبئة',
}

interface StockEntryPurposeBadgeProps {
  purpose?: StockEntryPurpose | string
}

export function StockEntryPurposeBadge({ purpose }: StockEntryPurposeBadgeProps) {
  if (!purpose) {
    return <Badge tone="neutral">بدون نوع</Badge>
  }

  return <Badge tone="blue">{purposeLabels[purpose] ?? purpose}</Badge>
}

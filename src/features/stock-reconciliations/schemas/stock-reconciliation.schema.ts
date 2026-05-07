import { z } from 'zod'

export const stockReconciliationItemSchema = z.object({
  item_code: z.string().trim().min(1, 'كود الصنف مطلوب.'),
  item_name: z.string().optional(),
  warehouse: z.string().trim().min(1, 'المستودع مطلوب.'),
  qty: z.number().min(0, 'الكمية لا يمكن أن تكون سالبة.'),
  valuation_rate: z.number().min(0, 'سعر التقييم لا يمكن أن يكون سالبًا.').optional(),
  current_qty: z.number().optional(),
  current_valuation_rate: z.number().optional(),
  current_amount: z.number().optional(),
  batch_no: z.string().optional(),
  serial_and_batch_bundle: z.string().optional(),
})

export const stockReconciliationSchema = z.object({
  naming_series: z.string().trim().min(1, 'سلسلة الترقيم مطلوبة.'),
  company: z.string().trim().min(1, 'الشركة مطلوبة.'),
  posting_date: z.string().trim().min(1, 'تاريخ القيد مطلوب.'),
  posting_time: z.string().trim().min(1, 'وقت القيد مطلوب.'),
  purpose: z.enum(['Opening Stock', 'Stock Reconciliation']),
  set_posting_time: z.boolean().optional(),
  expense_account: z.string().optional(),
  cost_center: z.string().optional(),
  remarks: z.string().optional(),
  items: z.array(stockReconciliationItemSchema).min(1, 'أضف صنفًا واحدًا على الأقل.'),
})

export type StockReconciliationSchema = z.infer<typeof stockReconciliationSchema>

import { z } from 'zod'
import type { StockEntryPurpose } from '../types/stock.types'

const stockItemSchema = z.object({
  item_code: z.string().trim().min(1, 'كود الصنف مطلوب.'),
  item_name: z.string().optional(),
  description: z.string().optional(),
  qty: z.number().gt(0, 'الكمية يجب أن تكون أكبر من صفر.'),
  basic_rate: z.number().min(0, 'السعر لا يمكن أن يكون سالبًا.').optional(),
  uom: z.string().trim().min(1, 'وحدة القياس مطلوبة.'),
  stock_uom: z.string().trim().optional(),
  conversion_factor: z.number().gt(0, 'معامل التحويل يجب أن يكون أكبر من صفر.').optional(),
  s_warehouse: z.string().optional(),
  t_warehouse: z.string().optional(),
  batch_no: z.string().optional(),
  serial_no: z.string().optional(),
})

function needsSourceWarehouse(purpose?: StockEntryPurpose) {
  return purpose === 'Material Issue' || purpose === 'Material Transfer' || purpose === 'Repack'
}

function needsTargetWarehouse(purpose?: StockEntryPurpose) {
  return purpose === 'Material Receipt' || purpose === 'Material Transfer' || purpose === 'Repack'
}

export const stockEntrySchema = z
  .object({
    naming_series: z.string().trim().min(1, 'صيغة الترقيم مطلوبة.'),
    stock_entry_type: z.string().trim().min(1, 'نوع حركة المخزون مطلوب.'),
    purpose: z.string().optional(),
    company: z.string().trim().min(1, 'الشركة مطلوبة.'),
    posting_date: z.string().trim().min(1, 'تاريخ القيد مطلوب.'),
    posting_time: z.string().trim().min(1, 'وقت القيد مطلوب.'),
    set_posting_time: z.boolean().optional(),
    from_warehouse: z.string().optional(),
    to_warehouse: z.string().optional(),
    remarks: z.string().optional(),
    items: z.array(stockItemSchema).min(1, 'أضف صنفًا واحدًا على الأقل.'),
  })
  .superRefine((values, context) => {
    values.items.forEach((item, index) => {
      if (needsSourceWarehouse(values.purpose as StockEntryPurpose | undefined) && !(item.s_warehouse?.trim() || values.from_warehouse?.trim())) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'المستودع المصدر مطلوب لهذا النوع من الحركة.',
          path: ['items', index, 's_warehouse'],
        })
      }

      if (needsTargetWarehouse(values.purpose as StockEntryPurpose | undefined) && !(item.t_warehouse?.trim() || values.to_warehouse?.trim())) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'المستودع الهدف مطلوب لهذا النوع من الحركة.',
          path: ['items', index, 't_warehouse'],
        })
      }
    })
  })

export type StockEntrySchema = z.infer<typeof stockEntrySchema>

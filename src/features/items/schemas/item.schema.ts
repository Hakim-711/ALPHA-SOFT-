import { z } from 'zod'

const optionalNumber = z.number().nonnegative('القيمة لا يمكن أن تكون سالبة').optional()

export const itemSchema = z.object({
  item_code: z.string().min(1, 'كود الصنف مطلوب').max(140, 'كود الصنف طويل جدًا'),
  item_name: z.string().max(140, 'اسم الصنف طويل جدًا').optional(),
  item_group: z.string().min(1, 'مجموعة الصنف مطلوبة'),
  stock_uom: z.string().min(1, 'وحدة القياس الافتراضية مطلوبة'),
  brand: z.string().optional(),
  description: z.string().optional(),
  standard_rate: optionalNumber,
  valuation_rate: optionalNumber,
  disabled: z.boolean().optional(),
  is_stock_item: z.boolean().optional(),
  is_sales_item: z.boolean().optional(),
  is_purchase_item: z.boolean().optional(),
})

export type ItemSchema = z.infer<typeof itemSchema>

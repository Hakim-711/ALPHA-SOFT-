import { z } from 'zod'

const optionalNumber = z.number().nonnegative('القيمة لا يمكن أن تكون سالبة').optional()

const requiredNumber = z.number().positive('الكمية يجب أن تكون أكبر من صفر')

export const purchaseOrderItemSchema = z.object({
  item_code: z.string().trim().min(1, 'كود الصنف مطلوب'),
  item_name: z.string().trim().min(1, 'اسم الصنف مطلوب'),
  description: z.string().optional(),
  qty: requiredNumber,
  uom: z.string().trim().min(1, 'وحدة القياس مطلوبة'),
  stock_uom: z.string().optional(),
  rate: optionalNumber,
  warehouse: z.string().optional(),
  schedule_date: z.string().optional(),
})

export const purchaseOrderSchema = z.object({
  supplier: z.string().trim().min(1, 'المورد مطلوب'),
  company: z.string().trim().min(1, 'الشركة مطلوبة'),
  transaction_date: z.string().trim().min(1, 'تاريخ الطلب مطلوب'),
  schedule_date: z.string().optional(),
  currency: z.string().trim().min(1, 'العملة مطلوبة'),
  buying_price_list: z.string().trim().min(1, 'قائمة الأسعار مطلوبة'),
  set_warehouse: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, 'يجب إضافة صنف واحد على الأقل'),
})

export type PurchaseOrderSchema = z.infer<typeof purchaseOrderSchema>


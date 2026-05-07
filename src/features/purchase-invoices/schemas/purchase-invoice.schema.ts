import { z } from 'zod'

const purchaseInvoiceItemSchema = z.object({
  item_code: z.string().trim().min(1, 'كود الصنف مطلوب'),
  item_name: z.string().trim().min(1, 'اسم الصنف مطلوب'),
  description: z.string().optional(),
  qty: z.number().positive('الكمية يجب أن تكون أكبر من صفر'),
  uom: z.string().trim().min(1, 'وحدة القياس مطلوبة'),
  stock_uom: z.string().optional(),
  rate: z.number().nonnegative('السعر لا يمكن أن يكون سالبًا').optional(),
  warehouse: z.string().optional(),
  purchase_order: z.string().optional(),
})

export const purchaseInvoiceSchema = z.object({
  supplier: z.string().trim().min(1, 'المورد مطلوب'),
  company: z.string().trim().min(1, 'الشركة مطلوبة'),
  posting_date: z.string().trim().min(1, 'تاريخ القيد مطلوب'),
  due_date: z.string().optional(),
  currency: z.string().trim().min(1, 'العملة مطلوبة'),
  conversion_rate: z.number().positive('سعر التحويل يجب أن يكون أكبر من صفر').optional(),
  buying_price_list: z.string().trim().min(1, 'قائمة الأسعار مطلوبة'),
  set_warehouse: z.string().optional(),
  credit_to: z.string().trim().min(1, 'حساب الدائنين مطلوب').optional(),
  update_stock: z.boolean().optional(),
  remarks: z.string().optional(),
  items: z.array(purchaseInvoiceItemSchema).min(1, 'أضف صنفًا واحدًا على الأقل.'),
})

export type PurchaseInvoiceSchema = z.infer<typeof purchaseInvoiceSchema>

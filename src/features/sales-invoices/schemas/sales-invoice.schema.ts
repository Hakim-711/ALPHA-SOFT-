import { z } from 'zod'

const optionalNumber = z.number().nonnegative('القيمة لا يمكن أن تكون سالبة').optional()
const requiredNumber = z.number().positive('الكمية يجب أن تكون أكبر من صفر')

export const salesInvoiceItemSchema = z.object({
  item_code: z.string().trim().min(1, 'كود الصنف مطلوب'),
  item_name: z.string().trim().min(1, 'اسم الصنف مطلوب'),
  description: z.string().optional(),
  qty: requiredNumber,
  uom: z.string().trim().min(1, 'وحدة القياس مطلوبة'),
  stock_uom: z.string().optional(),
  rate: optionalNumber,
  warehouse: z.string().optional(),
})

export const salesInvoiceSchema = z.object({
  customer: z.string().trim().min(1, 'العميل مطلوب'),
  company: z.string().trim().min(1, 'الشركة مطلوبة'),
  posting_date: z.string().trim().min(1, 'تاريخ القيد مطلوب'),
  due_date: z.string().optional(),
  currency: z.string().trim().min(1, 'العملة مطلوبة'),
  conversion_rate: optionalNumber,
  selling_price_list: z.string().trim().min(1, 'قائمة الأسعار مطلوبة'),
  set_warehouse: z.string().optional(),
  debit_to: z.string().trim().min(1, 'حساب المدين مطلوب'),
  update_stock: z.boolean().optional(),
  remarks: z.string().optional(),
  items: z.array(salesInvoiceItemSchema).min(1, 'يجب إضافة صنف واحد على الأقل'),
})

export type SalesInvoiceSchema = z.infer<typeof salesInvoiceSchema>

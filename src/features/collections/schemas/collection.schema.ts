import { z } from 'zod'

const collectionReferenceSchema = z.object({
  reference_name: z.string().min(1, 'اختر فاتورة صالحة.'),
  due_date: z.string().optional(),
  total_amount: z.number().optional(),
  outstanding_amount: z.number().optional(),
  allocated_amount: z.number().min(0.01, 'يجب إدخال مبلغ تخصيص أكبر من صفر.'),
  invoice_currency: z.string().optional(),
  debit_to: z.string().optional(),
})

export const collectionSchema = z.object({
  company: z.string().min(1, 'الشركة مطلوبة.'),
  posting_date: z.string().min(1, 'تاريخ السند مطلوب.'),
  customer: z.string().min(1, 'العميل مطلوب.'),
  paid_from: z.string().min(1, 'حساب الذمم مطلوب.'),
  paid_to: z.string().min(1, 'حساب التحصيل مطلوب.'),
  paid_amount: z.number().min(0.01, 'المبلغ المحصل يجب أن يكون أكبر من صفر.'),
  received_amount: z.number().min(0.01, 'المبلغ الداخل إلى الصندوق يجب أن يكون أكبر من صفر.'),
  source_exchange_rate: z.number().positive('سعر صرف العميل يجب أن يكون أكبر من صفر.'),
  target_exchange_rate: z.number().positive('سعر صرف الصندوق يجب أن يكون أكبر من صفر.'),
  mode_of_payment: z.string().optional(),
  reference_no: z.string().optional(),
  reference_date: z.string().optional(),
  remarks: z.string().optional(),
  references: z.array(collectionReferenceSchema),
})

export type CollectionSchema = z.infer<typeof collectionSchema>

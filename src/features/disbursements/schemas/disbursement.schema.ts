import { z } from 'zod'

const positiveAmount = z.number().positive('المبلغ يجب أن يكون أكبر من صفر')
const exchangeRate = z.number().positive('سعر الصرف يجب أن يكون أكبر من صفر')

export const disbursementReferenceSchema = z.object({
  reference_name: z.string().min(1, 'اختر فاتورة شراء صالحة.'),
  due_date: z.string().optional(),
  total_amount: z.number().optional(),
  outstanding_amount: z.number().optional(),
  allocated_amount: positiveAmount,
  invoice_currency: z.string().optional(),
  credit_to: z.string().optional(),
})

export const disbursementSchema = z.object({
  company: z.string().trim().min(1, 'الشركة مطلوبة'),
  posting_date: z.string().trim().min(1, 'تاريخ السند مطلوب'),
  supplier: z.string().trim().min(1, 'المورد مطلوب'),
  paid_from: z.string().trim().min(1, 'حساب الصرف مطلوب'),
  paid_to: z.string().trim().min(1, 'حساب الدائنين مطلوب'),
  paid_amount: positiveAmount,
  received_amount: positiveAmount,
  source_exchange_rate: exchangeRate,
  target_exchange_rate: exchangeRate,
  mode_of_payment: z.string().optional(),
  reference_no: z.string().optional(),
  reference_date: z.string().optional(),
  remarks: z.string().optional(),
  references: z.array(disbursementReferenceSchema),
})

export type DisbursementSchema = z.infer<typeof disbursementSchema>

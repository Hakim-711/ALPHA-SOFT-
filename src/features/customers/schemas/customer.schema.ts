import { z } from 'zod'

export const customerSchema = z.object({
  customer_name: z.string().trim().min(1, 'اسم العميل مطلوب').max(140, 'اسم العميل طويل جدًا'),
  customer_type: z.enum(['Individual', 'Company']),
  customer_group: z.string().optional(),
  territory: z.string().optional(),
  mobile_no: z.string().optional(),
  email_id: z.string().email('صيغة البريد الإلكتروني غير صحيحة').or(z.literal('')).optional(),
  tax_id: z.string().optional(),
  address: z.string().optional(),
  customer_details: z.string().optional(),
  disabled: z.boolean().optional(),
})

export type CustomerSchema = z.infer<typeof customerSchema>

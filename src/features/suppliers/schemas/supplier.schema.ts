import { z } from 'zod'

export const supplierSchema = z.object({
  supplier_name: z.string().trim().min(1, 'اسم المورد مطلوب').max(140, 'اسم المورد طويل جدًا'),
  supplier_type: z.enum(['Individual', 'Company']),
  supplier_group: z.string().optional(),
  country: z.string().optional(),
  default_currency: z.string().optional(),
  payment_terms: z.string().optional(),
  website: z.string().url('رابط الموقع غير صالح').or(z.literal('')).optional(),
  mobile_no: z.string().optional(),
  email_id: z.string().email('صيغة البريد الإلكتروني غير صحيحة').or(z.literal('')).optional(),
  tax_id: z.string().optional(),
  address: z.string().optional(),
  supplier_details: z.string().optional(),
  disabled: z.boolean().optional(),
})

export type SupplierSchema = z.infer<typeof supplierSchema>

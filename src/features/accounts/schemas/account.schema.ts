import { z } from 'zod'

export const accountSchema = z.object({
  email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('البريد الإلكتروني غير صالح'),
  first_name: z.string().min(1, 'الاسم الأول مطلوب').max(140, 'الاسم طويل جدًا'),
  last_name: z.string().max(140, 'اسم العائلة طويل جدًا').optional().or(z.literal('')),
  username: z.string().max(140, 'اسم المستخدم طويل جدًا').optional().or(z.literal('')),
  mobile_no: z.string().max(140, 'رقم الجوال طويل جدًا').optional().or(z.literal('')),
  user_type: z.enum(['System User', 'Website User']),
  enabled: z.boolean(),
  send_welcome_email: z.boolean(),
  new_password: z
    .string()
    .min(6, 'كلمة المرور يجب ألا تقل عن 6 أحرف')
    .max(140, 'كلمة المرور طويلة جدًا')
    .optional()
    .or(z.literal('')),
  roles: z.array(z.string()).min(1, 'اختر دورًا واحدًا على الأقل'),
})

export type AccountSchema = z.infer<typeof accountSchema>

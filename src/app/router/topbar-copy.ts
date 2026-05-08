interface TopbarCopy {
  eyebrow: string
  title: string
}

const topbarRoutes: Array<{ prefix: string; copy: TopbarCopy }> = [
  { prefix: '/dashboard', copy: { eyebrow: 'لوحة التحكم / ERP', title: 'نظرة تشغيلية' } },
  { prefix: '/accounts', copy: { eyebrow: 'النظام / الحسابات', title: 'إدارة الحسابات والصلاحيات' } },
  { prefix: '/items', copy: { eyebrow: 'المخزون / المنتجات', title: 'إدارة المنتجات' } },
  { prefix: '/pos', copy: { eyebrow: 'المبيعات / نقطة البيع', title: 'نقطة البيع POS' } },
  { prefix: '/cash-shifts', copy: { eyebrow: 'المالية / ورديات POS', title: 'ورديات الكاشير وإغلاق الصندوق' } },
  { prefix: '/sales-orders', copy: { eyebrow: 'المبيعات / أوامر البيع', title: 'إدارة أوامر البيع' } },
  { prefix: '/collections', copy: { eyebrow: 'المالية / التحصيلات', title: 'إدارة التحصيلات' } },
  { prefix: '/sales-invoices', copy: { eyebrow: 'المبيعات / فواتير البيع', title: 'إدارة فواتير البيع' } },
  { prefix: '/suppliers', copy: { eyebrow: 'المشتريات / الموردون', title: 'إدارة الموردين' } },
  { prefix: '/purchase-orders', copy: { eyebrow: 'المشتريات / أوامر الشراء', title: 'إدارة أوامر الشراء' } },
  { prefix: '/purchase-invoices', copy: { eyebrow: 'المشتريات / فواتير الشراء', title: 'إدارة فواتير الشراء' } },
  { prefix: '/daily-cash', copy: { eyebrow: 'المالية / الصندوق اليومي', title: 'الصندوق اليومي' } },
  { prefix: '/statements', copy: { eyebrow: 'المالية / كشوف الحساب', title: 'كشوف حساب العملاء والموردين' } },
  { prefix: '/disbursements', copy: { eyebrow: 'المالية / سندات الصرف', title: 'إدارة سندات الصرف' } },
  { prefix: '/stock-reconciliations', copy: { eyebrow: 'التشغيل / الجرد والتسوية', title: 'إدارة الجرد وتسوية المخزون' } },
  { prefix: '/stock', copy: { eyebrow: 'التشغيل / حركات المخزون', title: 'إدارة حركات المخزون' } },
  { prefix: '/reports', copy: { eyebrow: 'التشغيل / التقارير', title: 'تقارير التشغيل' } },
  { prefix: '/settings', copy: { eyebrow: 'النظام / الإعدادات', title: 'إعدادات المحل' } },
]

export function resolveTopbarCopy(pathname: string): TopbarCopy {
  return topbarRoutes.find((route) => pathname.startsWith(route.prefix))?.copy ?? {
    eyebrow: 'المبيعات / CRM',
    title: 'إدارة العملاء',
  }
}

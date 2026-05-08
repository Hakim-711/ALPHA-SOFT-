import {
  BarChart3,
  Boxes,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  DoorOpen,
  FileText,
  HandCoins,
  LayoutDashboard,
  Package,
  ScanBarcode,
  Settings,
  ShoppingBasket,
  Truck,
  UserCog,
  UsersRound,
  Wallet,
} from 'lucide-react'

export const navSections = ['مساحة العمل', 'المبيعات', 'المشتريات', 'المالية', 'التشغيل', 'النظام'] as const

export const navItems = [
  { label: 'لوحة التحكم', path: '/dashboard', icon: LayoutDashboard, enabled: true, section: 'مساحة العمل' },
  { label: 'العملاء', path: '/customers', icon: UsersRound, enabled: true, section: 'مساحة العمل' },
  { label: 'المنتجات', path: '/items', icon: Package, enabled: true, section: 'مساحة العمل' },
  { label: 'نقطة البيع POS', path: '/pos', icon: ScanBarcode, enabled: true, section: 'مساحة العمل' },
  { label: 'ورديات الكاشير', path: '/cash-shifts', icon: DoorOpen, enabled: true, section: 'مساحة العمل' },
  { label: 'أوامر البيع', path: '/sales-orders', icon: FileText, enabled: true, section: 'المبيعات' },
  { label: 'فواتير البيع', path: '/sales-invoices', icon: Building2, enabled: true, section: 'المبيعات' },
  { label: 'الموردون', path: '/suppliers', icon: Truck, enabled: true, section: 'المشتريات' },
  { label: 'أوامر الشراء', path: '/purchase-orders', icon: FileText, enabled: true, section: 'المشتريات' },
  { label: 'فواتير الشراء', path: '/purchase-invoices', icon: ShoppingBasket, enabled: true, section: 'المشتريات' },
  { label: 'الصندوق اليومي', path: '/daily-cash', icon: Wallet, enabled: true, section: 'المالية' },
  { label: 'كشوف الحساب', path: '/statements', icon: FileText, enabled: true, section: 'المالية' },
  { label: 'التحصيلات', path: '/collections', icon: HandCoins, enabled: true, section: 'المالية' },
  { label: 'سندات الصرف', path: '/disbursements', icon: CircleDollarSign, enabled: true, section: 'المالية' },
  { label: 'حركات المخزون', path: '/stock', icon: Boxes, enabled: true, section: 'التشغيل' },
  { label: 'الجرد والتسوية', path: '/stock-reconciliations', icon: ClipboardCheck, enabled: true, section: 'التشغيل' },
  { label: 'التقارير', path: '/reports', icon: BarChart3, enabled: true, section: 'التشغيل' },
  { label: 'الحسابات والصلاحيات', path: '/accounts', icon: UserCog, enabled: true, section: 'النظام' },
  { label: 'الإعدادات', path: '/settings', icon: Settings, enabled: true, section: 'النظام' },
] as const

export type NavItem = (typeof navItems)[number]
export type NavSection = (typeof navSections)[number]

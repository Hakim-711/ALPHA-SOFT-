# ProjectK Architecture Guide

## الهدف

ProjectK هو واجهة React عربية فوق ERPNext. لا يستبدل منطق ERPNext، بل يعرضه بطريقة أبسط للمحلات والسوبرماركت في اليمن ومأرب.

## القاعدة الأساسية

ERPNext هو مصدر الحقيقة لكل ما يلي:

- الصلاحيات
- التحقق
- الاعتماد والإلغاء
- الحسابات
- المخزون
- أسماء المستندات
- العلاقات بين المستندات

الواجهة مسؤولة عن:

- سهولة الاستخدام
- سرعة الإدخال
- العرض الواضح
- تنظيم الشاشات
- التعامل الجيد مع الأخطاء والتحميل

## طبقات المشروع

```txt
src/app
  router
  providers

src/core
  api
  config

src/features
  module/api
  module/hooks
  module/types
  module/schemas
  module/components
  module/pages

src/shared
  ui
  hooks
  utils
  tokens
```

## قواعد التطوير

- لا تضع منطق ERP داخل الصفحة مباشرة إذا كان قابلًا لإعادة الاستخدام.
- اجعل `api` مسؤولًا عن شكل طلبات ERPNext.
- اجعل `hooks` مسؤولة عن TanStack Query والحالة القادمة من السيرفر.
- اجعل `components` مسؤولة عن العرض فقط قدر الإمكان.
- لا تنشئ CRUD عشوائيًا بدون فهم lifecycle و docstatus والصلاحيات.

## الوحدات الحالية

- Auth
- Dashboard
- Accounts & Permissions
- Customers
- Suppliers
- Items
- Sales Orders
- Sales Invoices
- Purchase Orders
- Purchase Invoices
- Collections
- Disbursements
- Daily Cash
- Stock Entries
- Stock Reconciliation
- Reports
- POS
- Settings

## الأولويات القادمة

- فصل حسابات POS إلى calculators/usecases.
- إضافة Offline Queue للـ POS.
- بناء Notification Center.
- إضافة اختبارات Unit و E2E.
- توثيق API لكل Doctype منفذ.

# ERPNext API Map

## النمط العام

يعتمد المشروع على REST و Frappe methods:

```txt
GET    /api/resource/:doctype
GET    /api/resource/:doctype/:name
POST   /api/resource/:doctype
PUT    /api/resource/:doctype/:name
POST   /api/method/frappe.client.submit
POST   /api/method/frappe.client.cancel
```

## الوحدات المنفذة

| الوحدة | Doctype رئيسي | ملاحظات |
| --- | --- | --- |
| العملاء | Customer | بيانات أساسية، تعطيل بدل حذف |
| الموردون | Supplier | مرتبط بالمشتريات وسندات الصرف |
| المنتجات | Item | يدعم أصناف مخزنية وغير مخزنية |
| أوامر البيع | Sales Order | مستند قابل للاعتماد والإلغاء |
| فواتير البيع | Sales Invoice | أساس POS والديون والتحصيل |
| أوامر الشراء | Purchase Order | مرتبط بالموردين والتقارير |
| فواتير الشراء | Purchase Invoice | مرتبط بذمم الموردين |
| التحصيلات | Payment Entry | `Receive` من العملاء |
| سندات الصرف | Payment Entry | `Pay` للموردين والمصاريف |
| المخزون | Stock Entry | حركات تشغيلية للمخزون |
| الجرد | Stock Reconciliation | تسوية الرصيد |

## قواعد التعامل

- لا يتم اعتماد أو إلغاء المستند من الواجهة بمنطق محلي.
- كل submit/cancel يمر عبر ERPNext.
- كل validation قادم من ERPNext يظهر للمستخدم.
- أي حسابات تقديرية في الواجهة تعتبر قراءة مؤقتة فقط حتى يحسب ERPNext النتيجة النهائية.

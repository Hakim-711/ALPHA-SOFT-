# Coding Standards

## قواعد عامة

- استخدم TypeScript بوضوح ولا تعتمد على `any` إلا عند ضرورة واضحة.
- لا تكرر API logic داخل الصفحات.
- لا تخزن أسرار داخل الكود.
- لا تضف مكونًا جديدًا إذا كان يوجد مكون مشترك مناسب.
- لا تعرض زرًا لا يملك المستخدم صلاحية استخدامه.

## تسمية الملفات

```txt
feature-name.api.ts
use-feature-name.ts
feature-name.types.ts
feature-name.schema.ts
feature-name-page.tsx
feature-name-form.tsx
```

## الصفحات

كل صفحة تشغيلية يجب أن تحتوي على:

- Breadcrumbs
- PageHeader
- Loading state
- Empty state
- Error state
- Permission-aware actions

## النماذج

- Zod للتحقق الأمامي الخفيف.
- ERPNext هو التحقق النهائي.
- الحقول المطلوبة يجب أن تظهر بوضوح.
- الحقول المرتبطة تستخدم Link/Datalist أو Select من بيانات ERPNext.

## التقارير

- كل تقرير يجب أن يتعامل مع فشل جزئي بدون إسقاط الصفحة كاملة.
- الأرقام متعددة العملات لا تدمج في رقم واحد.
- روابط السجلات يجب أن تفتح المستند الأصلي داخل الواجهة.

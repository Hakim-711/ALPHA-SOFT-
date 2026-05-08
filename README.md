# ALPHA-SOFT

واجهة ERP/POS عربية حديثة مبنية فوق ERPNext.

## الفكرة

ALPHA-SOFT ليست بديلًا لمحرك ERPNext.  
ERPNext يبقى مصدر الحقيقة للبيانات، الصلاحيات، القيود، المخزون، وسير العمل.  
هذا المشروع هو طبقة تجربة استخدام حديثة ومبسطة للمستخدم العربي، خصوصًا للمحلات والمتاجر الصغيرة والمتوسطة في اليمن ومأرب.

## الحالة الحالية

المرحلة الحالية: `Foundation Hardening`

الهدف الآن ليس إضافة ميزات جديدة بسرعة، بل تثبيت الأساس قبل التوسع:

- أمان إعدادات البيئة.
- CI.
- تنظيم المعمارية.
- توثيق التشغيل.
- QA أساسي قبل أي توسع تجاري.

## التقنية

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Axios
- Zod
- React Hook Form

## التشغيل المحلي

```bash
npm install
npm run dev
```

ثم افتح:

```text
http://127.0.0.1:5173
```

## إعدادات البيئة

انسخ الملف:

```bash
cp .env.example .env
```

الإعدادات المسموحة:

```env
VITE_API_BASE_URL=
VITE_ERPNEXT_PROXY_TARGET=http://localhost:8000
```

### قاعدة أمان مهمة

لا تضع ERPNext API Secret أو API Key داخل متغيرات `VITE_*`.

أي متغير يبدأ بـ `VITE_` يتم تضمينه داخل كود المتصفح، لذلك لا يعتبر سرًا.  
الاتصال الصحيح يكون عبر:

- ERPNext session cookies.
- same-origin `/api`.
- reverse proxy.
- backend-for-frontend عند الحاجة.

## أوامر الجودة

```bash
npm run lint
npm run typecheck
npm run build
```

هذه الأوامر تعمل أيضًا داخل GitHub Actions.

## CI

تمت إضافة GitHub Actions في:

```text
.github/workflows/ci.yml
```

ويفحص:

- lint
- typecheck
- production build

## بنية المشروع

```text
src/
  app/
    router/
    providers/
  core/
    api/
    config/
  features/
    auth/
    customers/
    pos/
    pos-returns/
    cash-shifts/
    daily-cash/
    sales-invoices/
    ...
  shared/
    ui/
    utils/
```

## وحدات تشغيلية موجودة

- تسجيل الدخول عبر ERPNext.
- لوحة تحكم.
- العملاء.
- الأصناف.
- POS مستقل.
- فتح وإغلاق وردية الكاشير.
- مرتجعات POS.
- استرداد نقدي للعميل.
- الصندوق اليومي.
- فواتير البيع.
- المشتريات الأساسية.
- المخزون والجرد.
- الحسابات والصلاحيات.

## قواعد التطوير

- ERPNext هو مصدر الحقيقة.
- لا منطق محاسبي وهمي داخل الواجهة.
- لا أسرار داخل frontend.
- لا إضافة ميزة جديدة قبل تثبيت الأساس إذا كانت تزيد الدين التقني.
- أي تغيير مهم يجب أن يمر عبر `lint`, `typecheck`, و `build`.
- أي شاشة مالية يجب أن تراعي الصلاحيات، الحالات الفارغة، الأخطاء، وحالات التحميل.

## أولويات المرحلة الحالية

Critical:

- تأمين env.
- CI.
- README حقيقي.
- login redirect hardening.

High:

- تقسيم router/layout/navigation.
- خدمة صلاحيات أوضح.
- توثيق معماري.

Medium:

- Error boundaries.
- QA آلي.
- تقارير مجمعة من السيرفر.
- تحسين offline queue.

## الهدف التجاري

تحويل ERPNext إلى تجربة عربية سهلة وقوية للتاجر الحقيقي:

- بيع سريع.
- دين وقبض وصرف.
- ورديات كاشير.
- مرتجعات واستردادات.
- صندوق يومي.
- مخزون.
- تقارير مفهومة.

المنتج يجب أن يكون بسيطًا للمستخدم، لكنه محافظ على قوة ERPNext في الخلفية.

# Product Direction v1

Project: ProjectK  
Date: 2026-04-21  
Status: Foundation artifact  
Language: English / Arabic

## 1. Executive Summary

### EN

ProjectK is a React-based ERPNext front-end modernization initiative. The product will deliver a custom, high-quality user interface while ERPNext remains the business engine and source of truth for validation, permissions, workflows, document states, relationships, calculations, and database truth.

The front-end must make ERPNext easier, faster, and clearer to use. It must not replace ERPNext logic, hide critical business meaning, or create client-side behavior that conflicts with the server.

### AR

ProjectK هو مشروع لتحديث واجهة ERPNext باستخدام React. الهدف هو بناء واجهة مخصصة وعالية الجودة مع بقاء ERPNext هو محرك الأعمال والمصدر الأساسي للحقيقة في التحقق من البيانات والصلاحيات وسير العمل وحالات المستندات والعلاقات والحسابات وقاعدة البيانات.

يجب أن تجعل الواجهة استخدام ERPNext أسهل وأسرع وأوضح، دون استبدال منطق ERPNext أو إخفاء معاني العمل المهمة أو إنشاء منطق في الواجهة يتعارض مع السيرفر.

## 2. Vision

### EN

Build a modern, high-performance React ERP front-end that accurately represents ERPNext's backend logic, workflows, permissions, relationships, and data model while improving usability, navigation, speed, and visual quality.

### AR

بناء واجهة ERP حديثة وسريعة باستخدام React تعكس بدقة منطق ERPNext وسير العمل والصلاحيات والعلاقات ونموذج البيانات، مع تحسين سهولة الاستخدام والتنقل والسرعة والجودة البصرية.

## 3. Product Philosophy

### EN

- ERPNext is the source of truth.
- React is the presentation and interaction layer.
- The UI may simplify usage, but not change business meaning.
- The front-end must reflect backend permissions, document states, workflows, and validation.
- Client-side checks are allowed only as helpful guidance before the server confirms the truth.
- No fake totals, fake statuses, fake permissions, or fake document relationships.
- The UI should be metadata-aware and adaptable as ERPNext evolves.

### AR

- ERPNext هو المصدر الأساسي للحقيقة.
- React هو طبقة العرض والتفاعل.
- يمكن للواجهة أن تسهل الاستخدام، لكنها لا تغير معنى العمل.
- يجب أن تعكس الواجهة الصلاحيات وحالات المستندات وسير العمل والتحقق الموجود في السيرفر.
- يمكن استخدام التحقق في الواجهة فقط كإرشاد قبل تأكيد السيرفر.
- لا توجد مجاميع وهمية أو حالات وهمية أو صلاحيات وهمية أو علاقات مستندات وهمية.
- يجب أن تكون الواجهة واعية بالبيانات الوصفية وقابلة للتطور مع ERPNext.

## 4. Non-Negotiable Rule

### EN

The front-end must not fight the backend.

If ERPNext defines a required field, document lifecycle, child table, linked doctype, permission, validation rule, workflow action, naming rule, or server-calculated total, the React front-end must represent it correctly and submit backend-compatible data.

### AR

يجب ألا تتعارض الواجهة مع السيرفر.

إذا كان ERPNext يحدد حقلا إلزاميا أو دورة حياة مستند أو جدول أطفال أو ارتباطا مع Doctype آخر أو صلاحية أو قاعدة تحقق أو إجراء سير عمل أو قاعدة تسمية أو قيمة محسوبة من السيرفر، فيجب أن تمثل واجهة React ذلك بشكل صحيح وترسل بيانات متوافقة مع السيرفر.

## 5. Scope

### MVP Scope

| Area | EN | AR |
| --- | --- | --- |
| Authentication | Login, session handling, logout | تسجيل الدخول والجلسة وتسجيل الخروج |
| App shell | Sidebar, topbar, navigation, role-aware menu | الهيكل العام والتنقل والقوائم حسب الصلاحيات |
| Dashboard shell | Operational KPIs from ERPNext data | مؤشرات تشغيلية من بيانات ERPNext |
| Customers | Customer list, detail, create, edit, relationships | العملاء: عرض وتفاصيل وإنشاء وتعديل وعلاقات |
| Items / Products | Item list, detail, create, edit, stock-aware display | المنتجات: عرض وتفاصيل وإنشاء وتعديل وبيانات مخزون |
| Sales Orders | Transaction list, form, detail, workflow actions | أوامر البيع وسير العمل الخاص بها |
| Sales Invoices | Full transactional form with child tables and lifecycle | فواتير البيع مع الجداول التابعة ودورة الحياة |
| Basic Inventory | Warehouses and stock balance visibility | المستودعات وأرصدة المخزون بشكل أساسي |
| Basic Reports | Essential operational reports and dashboard data | التقارير التشغيلية الأساسية |

### Phase 1 Exclusions

| EN | AR |
| --- | --- |
| Payroll and advanced HR | الرواتب والموارد البشرية المتقدمة |
| Manufacturing | التصنيع |
| Deep accounting flows | التدفقات المحاسبية المتقدمة |
| Complex workflow customization UI | واجهة تخصيص سير العمل المعقدة |
| Multi-tenant SaaS billing | فوترة SaaS متعددة الشركات |
| Full replacement of ERPNext Desk for every edge case | استبدال كامل لكل حالة متقدمة في واجهة ERPNext الأصلية |

## 6. Ownership Model

| Concern | ERPNext Backend Owns | React Front-End Owns |
| --- | --- | --- |
| Data truth | Database records and document integrity | Displaying current server data clearly |
| Validation | Required fields, business rules, accounting and stock checks | Friendly pre-validation and server error presentation |
| Calculations | Totals, taxes, stock, accounting, balances | Showing calculated values and refresh state |
| Permissions | Authoritative access control | Hiding, disabling, and explaining unavailable UI actions |
| Workflow | Allowed transitions and document states | Workflow action bars and status badges |
| Relationships | Link fields, child tables, references, ledgers | Navigation, related records, and relationship panels |
| Naming | Naming series and generated document names | Showing names and respecting backend naming behavior |
| UX | Not primary owner | Layout, navigation, interaction quality, accessibility |

## 7. Frontend Visibility Rule

Every backend field or concept must be classified before implementation.

| Classification | Meaning | UI Treatment |
| --- | --- | --- |
| Required for display | Operationally meaningful but not edited | Show in list, detail, summary, or related panel |
| Required for editing | User must provide or change it | Show in forms with correct widget and validation |
| Required for workflow | Needed to understand or perform document actions | Show near status, actions, or validation panel |
| Admin/debug only | Useful for support, configuration, audit, or troubleshooting | Hide by default, expose in admin/debug surfaces |
| Internal only | Backend implementation detail with no user value | Do not show in normal UI, still preserve in payload when required |

### AR

يجب تصنيف كل حقل أو مفهوم من السيرفر قبل التنفيذ.

| التصنيف | المعنى | طريقة العرض |
| --- | --- | --- |
| مطلوب للعرض | مهم تشغيليا ولا يتم تعديله | يظهر في القوائم أو التفاصيل أو الملخصات أو العلاقات |
| مطلوب للتعديل | يجب أن يدخله أو يعدله المستخدم | يظهر في النماذج مع أداة إدخال وتحقق مناسب |
| مطلوب لسير العمل | ضروري لفهم أو تنفيذ إجراءات المستند | يظهر قرب الحالة أو الإجراءات أو لوحة التحقق |
| للمدير أو التشخيص | مفيد للدعم أو الإعداد أو التدقيق | يخفى افتراضيا ويظهر في واجهات الإدارة أو التشخيص |
| داخلي فقط | تفصيل داخلي لا يفيد المستخدم | لا يظهر في الواجهة العادية مع الحفاظ عليه في البيانات عند الحاجة |

## 8. Implementation Principles

### EN

1. Start from ERPNext concepts, not generic CRUD.
2. Treat DocTypes as business documents with metadata, relationships, state, and permissions.
3. Use the target ERPNext instance metadata to confirm fields, required rules, read-only behavior, and child tables.
4. Use shared API and permission interpretation layers instead of one-off screen logic.
5. Use server-state tooling for lists, documents, reports, permissions, and workflow states.
6. Make every major document support list, detail, form, actions, loading, empty, and error states as needed.
7. Keep the UI clean, but never hide critical operational truth.

### AR

1. ابدأ من مفاهيم ERPNext وليس من CRUD عام.
2. تعامل مع DocTypes كمستندات أعمال لها بيانات وصفية وعلاقات وحالة وصلاحيات.
3. استخدم بيانات ERPNext الفعلية لتأكيد الحقول والقواعد والقراءة فقط والجداول التابعة.
4. استخدم طبقات مشتركة للـ API والصلاحيات بدلا من منطق متكرر داخل كل شاشة.
5. استخدم أدوات إدارة server state للقوائم والمستندات والتقارير والصلاحيات وحالات سير العمل.
6. يجب أن يدعم كل مستند مهم القوائم والتفاصيل والنماذج والإجراءات وحالات التحميل والفراغ والأخطاء حسب الحاجة.
7. اجعل الواجهة نظيفة، لكن لا تخف الحقيقة التشغيلية المهمة.

## 9. Recommended Technical Direction

| Layer | Direction |
| --- | --- |
| UI framework | React with TypeScript |
| Build/runtime | Vite now; Next.js can be reconsidered only if server rendering or file routing becomes strategically useful |
| Routing | React Router for the Vite app |
| Server state | TanStack Query |
| Forms | Reusable form system driven by ERPNext metadata and doctype specs |
| Validation | Zod for client-side shape checks; ERPNext remains authoritative |
| Tables | Strong reusable data table with filters, sorting, pagination, row actions |
| Permissions | Central permission interpreter using ERPNext roles and API results |
| API layer | Shared ERPNext client for resources, methods, reports, metadata, and auth |

## 10. Success Criteria

### EN

- Users can authenticate and maintain a secure session.
- Menus, pages, fields, and actions reflect the current user's permissions.
- Customer and Item master data can be listed, opened, created, and edited correctly.
- Sales Orders and Sales Invoices can be created, edited, submitted, cancelled, and navigated through according to ERPNext rules.
- Child tables work with backend-compatible payloads.
- Linked records are clickable and discoverable.
- Server validation errors are shown clearly and do not get swallowed by the UI.
- Dashboard and reports use real ERPNext data.
- Users can complete core Phase 1 workflows without falling back to the old ERPNext UI.

### AR

- يستطيع المستخدم تسجيل الدخول والحفاظ على جلسة آمنة.
- تعكس القوائم والصفحات والحقول والإجراءات صلاحيات المستخدم الحالي.
- يمكن عرض وفتح وإنشاء وتعديل بيانات العملاء والمنتجات بشكل صحيح.
- يمكن إنشاء وتعديل واعتماد وإلغاء أوامر البيع وفواتير البيع حسب قواعد ERPNext.
- تعمل الجداول التابعة مع بيانات متوافقة مع السيرفر.
- تكون السجلات المرتبطة قابلة للنقر والاكتشاف.
- تظهر أخطاء التحقق من السيرفر بوضوح.
- تستخدم لوحة التحكم والتقارير بيانات ERPNext حقيقية.
- يستطيع المستخدم تنفيذ تدفقات المرحلة الأولى الأساسية دون الرجوع إلى واجهة ERPNext الأصلية.

## 11. Module Definition of Done

A module is done only when it includes the relevant items below:

- List page with search, filters, sorting, pagination, loading, empty, and error states.
- Detail page with status, summary, important fields, linked records, and actions.
- Create and edit support where permitted.
- Correct field visibility, required behavior, read-only behavior, and validation display.
- Child table editing where the doctype requires it.
- Workflow actions and document lifecycle representation.
- Permission-aware menu, page, field, and action behavior.
- Related document navigation.
- API integration through the shared ERPNext client.
- Real server errors and validation feedback shown in a consistent way.

## 12. Delivery Sequence

1. Product Direction v1.
2. ERPNext Module Map v1.
3. Doctype Specification Template.
4. MVP Doctype Specification Sheets: Customer, Item, Sales Invoice, then Sales Order.
5. API Contract Mapping for MVP screens.
6. UX Standards Document.
7. React architecture setup: TypeScript, routing, server state, API layer, layout.
8. First implemented vertical slice: authentication, shell, Customer list/detail/form.


# ERPNext Module Map v1

Project: alpha-neqat  
Date: 2026-04-21  
Status: Foundation artifact  
Language: English / Arabic

## 1. Purpose

### EN

This document maps ERPNext business modules into the React front-end representation. It identifies module purpose, key DocTypes, user roles, workflows, dependencies, and initial implementation priority.

This is not a replacement for ERPNext metadata. Before implementation, each field, action, permission, and workflow must be confirmed against the target ERPNext instance and version.

### AR

تحدد هذه الوثيقة كيفية تحويل وحدات ERPNext إلى تمثيل داخل واجهة React. تشمل الوثيقة هدف كل وحدة، أهم DocTypes، أدوار المستخدمين، سير العمل، الاعتماديات، وأولوية التنفيذ.

هذه الوثيقة لا تستبدل بيانات ERPNext الوصفية. قبل التنفيذ يجب تأكيد كل حقل وإجراء وصلاحية وسير عمل من نسخة ERPNext الفعلية المستهدفة.

## 2. High-Level Structure

```text
Core
  - Auth
  - Users
  - Roles
  - Permissions
  - Settings

Selling / Sales
  - Customers
  - Quotations
  - Sales Orders
  - Delivery Notes
  - Sales Invoices

Stock / Inventory
  - Items
  - Warehouses
  - Stock Ledger
  - Stock Entries
  - Bins / Balances

Accounts
  - Companies
  - Accounts
  - Payment Entries
  - GL Entries
  - Taxes and Charges

Buying / Purchase
  - Suppliers
  - Purchase Orders
  - Purchase Receipts
  - Purchase Invoices

CRM
  - Leads
  - Opportunities
  - Contacts
  - Addresses

Projects
  - Projects
  - Tasks
  - Timesheets

Reports
  - Dashboards
  - Script reports
  - Query reports
  - Print and export outputs
```

## 3. Phase Priorities

| Phase | Modules | Goal |
| --- | --- | --- |
| Phase 1 | Auth, app shell, dashboard shell, Customers, Items, Sales Orders, Sales Invoices | Prove the architecture with core selling workflows |
| Phase 2 | Warehouses, stock views, payments, basic reports, purchase basics | Add operational depth around stock, cash, and buying |
| Phase 3 | Accounting depth, HR, projects, advanced reports, workflow customization | Expand into heavier business operations |
| Later | Manufacturing, payroll depth, advanced integrations | Add specialized modules after the front-end architecture is stable |

### AR

| المرحلة | الوحدات | الهدف |
| --- | --- | --- |
| المرحلة 1 | تسجيل الدخول، الهيكل العام، لوحة التحكم، العملاء، المنتجات، أوامر البيع، فواتير البيع | إثبات البنية من خلال تدفقات البيع الأساسية |
| المرحلة 2 | المستودعات، المخزون، الدفعات، التقارير الأساسية، المشتريات الأساسية | إضافة عمق تشغيلي للمخزون والنقد والمشتريات |
| المرحلة 3 | المحاسبة المتقدمة، الموارد البشرية، المشاريع، التقارير المتقدمة، تخصيص سير العمل | التوسع في العمليات التجارية الأعمق |
| لاحقا | التصنيع، الرواتب المتقدمة، التكاملات المتقدمة | إضافة الوحدات المتخصصة بعد استقرار البنية |

## 4. Module Breakdown

## Core: Auth, Users, Roles, Permissions

### EN

Purpose: Authenticate users, maintain session state, interpret permissions, and shape navigation based on role and access.

Key concepts:

- User
- Role
- Permission
- Session
- Company defaults
- User defaults

Primary users:

- System Manager
- Admin
- All authenticated users

Critical front-end requirements:

- Login and logout.
- Session refresh and expired-session handling.
- Permission-aware sidebar and route access.
- User profile and active company context.
- Clear permission-denied states.

### AR

الهدف: تسجيل الدخول وإدارة الجلسة وتفسير الصلاحيات وتشكيل التنقل حسب الدور والوصول.

المفاهيم الأساسية:

- المستخدم
- الدور
- الصلاحية
- الجلسة
- الإعدادات الافتراضية للشركة
- الإعدادات الافتراضية للمستخدم

متطلبات الواجهة:

- تسجيل الدخول والخروج.
- التعامل مع انتهاء الجلسة.
- قوائم ومسارات حسب الصلاحيات.
- ملف المستخدم وسياق الشركة الحالي.
- رسائل واضحة عند رفض الصلاحية.

## Selling / Sales

### EN

Purpose: Manage customer-facing sales operations from customer data to orders, delivery, invoicing, and payment follow-up.

Key DocTypes:

- Customer
- Quotation
- Sales Order
- Delivery Note
- Sales Invoice
- Sales Invoice Item
- Sales Taxes and Charges
- Payment Schedule

Primary roles:

- Sales User
- Sales Manager
- Accounts User
- System Manager

Major workflows:

- Customer creation and maintenance.
- Quotation to Sales Order.
- Sales Order to Delivery Note.
- Sales Order or Delivery Note to Sales Invoice.
- Sales Invoice submit, cancel, amend, print, email, and payment follow-up.

Dependencies:

- Customer links to Contact, Address, Territory, Customer Group, Payment Terms.
- Sales documents link to Company, Currency, Item, Warehouse, Taxes, Accounts, Cost Center.
- Submitted sales documents affect Accounts and sometimes Stock depending on configuration.

Front-end representation:

- Customer master pages.
- Sales document lists with status and docstatus.
- Transaction forms with child table editors.
- Workflow action bars for submit, cancel, amend, print, email, and create linked records.
- Related documents panel.

### AR

الهدف: إدارة عمليات البيع من بيانات العميل إلى العروض والأوامر والتسليم والفوترة ومتابعة السداد.

أهم DocTypes:

- العميل
- عرض السعر
- أمر البيع
- مذكرة التسليم
- فاتورة البيع
- صفوف فاتورة البيع
- ضرائب ورسوم البيع
- جدول السداد

أهم التدفقات:

- إنشاء وصيانة بيانات العملاء.
- تحويل عرض السعر إلى أمر بيع.
- تحويل أمر البيع إلى تسليم.
- تحويل أمر البيع أو التسليم إلى فاتورة بيع.
- اعتماد الفاتورة وإلغاؤها وتعديلها وطباعتها وإرسالها ومتابعة السداد.

اعتماديات مهمة:

- العميل يرتبط بجهات الاتصال والعناوين والمنطقة ومجموعة العملاء وشروط الدفع.
- مستندات البيع ترتبط بالشركة والعملة والمنتجات والمستودعات والضرائب والحسابات ومراكز التكلفة.
- المستندات المعتمدة تؤثر على المحاسبة وأحيانا المخزون حسب الإعدادات.

## Stock / Inventory

### EN

Purpose: Manage item masters, warehouses, stock balances, and inventory movement visibility.

Key DocTypes:

- Item
- Item Group
- Warehouse
- Bin
- Stock Ledger Entry
- Stock Entry
- Stock Reconciliation

Primary roles:

- Stock User
- Stock Manager
- Sales User
- Purchase User

Major workflows:

- Item creation and maintenance.
- Warehouse setup.
- Stock balance visibility.
- Stock movement through sales, purchase, and stock transactions.

Dependencies:

- Items are used by Sales, Purchase, Stock, and Accounts.
- Warehouses affect stock availability and transaction validation.
- Stock ledger entries are server-generated from submitted transactions.

Front-end representation:

- Item master list/detail/form.
- Warehouse and stock balance views.
- Item stock summary and movement links.
- Read-only stock ledger displays where relevant.

### AR

الهدف: إدارة المنتجات والمستودعات وأرصدة المخزون وحركات المخزون.

أهم DocTypes:

- المنتج
- مجموعة المنتجات
- المستودع
- الرصيد
- سجل حركة المخزون
- قيد المخزون
- تسوية المخزون

متطلبات الواجهة:

- صفحات المنتجات.
- صفحات المستودعات وأرصدة المخزون.
- ملخص المخزون للمنتج وروابط الحركات.
- عرض سجلات المخزون كبيانات من السيرفر.

## Accounts

### EN

Purpose: Represent financial impact, payments, taxes, ledger entries, and company accounting context.

Key DocTypes:

- Company
- Account
- Cost Center
- Sales Taxes and Charges Template
- Payment Entry
- GL Entry
- Fiscal Year
- Currency

Primary roles:

- Accounts User
- Accounts Manager
- System Manager

Major workflows:

- Payment against invoice.
- Tax calculation and display.
- General ledger visibility.
- Outstanding amount tracking.

Phase 1 treatment:

- Show accounting outputs that Sales Invoices depend on.
- Do not build deep accounting management in Phase 1.
- Preserve server truth for totals, taxes, outstanding amounts, and ledger effects.

### AR

الهدف: تمثيل الأثر المالي والدفعات والضرائب والقيود وسياق الشركة المحاسبي.

أهم DocTypes:

- الشركة
- الحساب
- مركز التكلفة
- قالب الضرائب والرسوم
- قيد الدفع
- قيود دفتر الأستاذ
- السنة المالية
- العملة

معالجة المرحلة الأولى:

- عرض النتائج المحاسبية التي تعتمد عليها فواتير البيع.
- عدم بناء إدارة محاسبية عميقة في المرحلة الأولى.
- الحفاظ على حقيقة السيرفر في المجاميع والضرائب والمبالغ المستحقة والقيود.

## Buying / Purchase

### EN

Purpose: Manage supplier-facing procurement from supplier records through purchase orders, receipts, and invoices.

Key DocTypes:

- Supplier
- Purchase Order
- Purchase Receipt
- Purchase Invoice
- Purchase Taxes and Charges

Phase 1 treatment:

- Not a primary implementation target.
- Keep architecture reusable so purchase transaction screens can reuse the sales transaction patterns.

### AR

الهدف: إدارة المشتريات من الموردين من بيانات المورد إلى أوامر الشراء والاستلام وفواتير الشراء.

معالجة المرحلة الأولى:

- ليست هدفا أساسيا في البداية.
- يجب أن تكون البنية قابلة لإعادة الاستخدام حتى تستفيد شاشات الشراء من أنماط شاشات البيع.

## CRM

### EN

Purpose: Manage customer pipeline, leads, opportunities, contacts, and addresses.

Key DocTypes:

- Lead
- Opportunity
- Contact
- Address
- Customer

Phase 1 treatment:

- Contact and Address relationships must be respected for Customer and Sales Invoice.
- Full lead/opportunity pipeline can come later.

### AR

الهدف: إدارة العملاء المحتملين والفرص وجهات الاتصال والعناوين.

معالجة المرحلة الأولى:

- يجب احترام علاقات جهات الاتصال والعناوين مع العميل وفاتورة البيع.
- يمكن تأجيل خط المبيعات الكامل لاحقا.

## Reports / Dashboard

### EN

Purpose: Show operational summaries, KPIs, and report outputs using ERPNext server data.

Key report areas:

- Sales totals.
- Outstanding invoices.
- Top customers.
- Stock balances.
- Low-stock items.
- Recent documents.

Critical front-end requirements:

- Reports must use ERPNext report APIs or backend-approved endpoints.
- Filters must match ERPNext expectations.
- Export and print should respect server output where relevant.
- Report permissions must be respected.

### AR

الهدف: عرض الملخصات التشغيلية والمؤشرات والتقارير باستخدام بيانات ERPNext من السيرفر.

مجالات التقارير:

- إجمالي المبيعات.
- الفواتير المستحقة.
- أفضل العملاء.
- أرصدة المخزون.
- المنتجات منخفضة المخزون.
- أحدث المستندات.

متطلبات مهمة:

- يجب أن تستخدم التقارير API التقارير في ERPNext أو نقاط نهاية معتمدة من السيرفر.
- يجب أن تطابق الفلاتر توقعات ERPNext.
- يجب احترام الصلاحيات.

## 5. Core Document Relationships

### Selling Flow

```text
Customer
  -> Quotation
  -> Sales Order
  -> Delivery Note
  -> Sales Invoice
  -> Payment Entry
```

### Stock Impact Flow

```text
Item
  -> Sales Order Item
  -> Delivery Note Item
  -> Sales Invoice Item
  -> Stock Ledger Entry
  -> Warehouse / Bin balance
```

### Accounting Impact Flow

```text
Sales Invoice
  -> Taxes and Charges
  -> GL Entry
  -> Outstanding Amount
  -> Payment Entry
```

### AR

توضح هذه العلاقات أن المستندات ليست صفحات CRUD منفصلة. كل مستند قد يؤثر على مستندات أخرى أو يعكس حالة مالية أو مخزنية لا يجوز للواجهة اختراعها أو تعديل معناها.

## 6. MVP Frontend Representation Matrix

| Doctype | Type | List | Detail | Create | Edit | Submit | Cancel | Child Tables | Related Links | Phase |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Customer | Master | Yes | Yes | Yes | Yes | No | No | Maybe | Yes | 1 |
| Item | Master | Yes | Yes | Yes | Yes | No | No | Yes | Yes | 1 |
| Sales Order | Transaction | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | 1 |
| Sales Invoice | Transaction | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | 1 |
| Warehouse | Master | Yes | Yes | Maybe | Maybe | No | No | No | Yes | 2 |
| Payment Entry | Transaction | Yes | Yes | Maybe | Maybe | Yes | Yes | Yes | Yes | 2 |
| Purchase Order | Transaction | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | 2 |

## 7. Key Architecture Implications

### EN

- Master DocTypes need clean list, detail, and edit patterns.
- Transaction DocTypes need lifecycle-aware pages with action bars, totals, child tables, status, and related documents.
- Link fields must become searchable selectors backed by ERPNext data.
- Child tables need reusable editors that preserve ERPNext payload shape.
- Status, docstatus, and workflow state must be visually distinct.
- Permission checks must be centralized.

### AR

- تحتاج البيانات الأساسية إلى أنماط واضحة للقوائم والتفاصيل والتعديل.
- تحتاج مستندات العمليات إلى صفحات واعية بدورة الحياة والإجراءات والمجاميع والجداول التابعة والحالة والعلاقات.
- يجب أن تتحول حقول الربط إلى اختيارات قابلة للبحث من بيانات ERPNext.
- تحتاج الجداول التابعة إلى محررات قابلة لإعادة الاستخدام وتحافظ على شكل البيانات المطلوب للسيرفر.
- يجب تمييز الحالة و docstatus وسير العمل بصريا.
- يجب مركزية فحص الصلاحيات.


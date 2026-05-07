# Doctype Specification: Sales Invoice

Status: Draft v1  
Phase: 1  
Last updated: 2026-04-21  
Note: Verify all fields, child tables, workflow rules, and permissions against the target ERPNext instance metadata before implementation.

## 1. Basic Information

| Field | Value |
| --- | --- |
| Doctype name | Sales Invoice |
| Module | Accounts / Selling |
| Type | Transaction |
| Submittable | Yes |
| Phase | 1 |

## 2. Purpose

### EN

Sales Invoice records a bill issued to a customer. It is one of the most important ERPNext transaction documents because it can affect accounts, outstanding receivables, taxes, payment schedules, and sometimes stock depending on configuration.

### AR

يمثل Sales Invoice الفاتورة الصادرة للعميل. وهو من أهم مستندات العمليات في ERPNext لأنه قد يؤثر على الحسابات والمبالغ المستحقة والضرائب وجداول الدفع وأحيانا المخزون حسب الإعدادات.

## 3. Business Context

| Question | Answer |
| --- | --- |
| Who uses it? | Sales users, accounts users, accounts managers, system managers |
| When is it created? | After or during a sale, often from Sales Order or Delivery Note |
| What process does it continue or finish? | Customer billing, revenue recognition, receivables, tax output, optional stock update |
| What records depend on it? | Payment Entry, GL Entry, Stock Ledger Entry when stock is updated, returns/credit notes, reports |
| What records does it depend on? | Customer, Company, Item, Warehouse, Account, Currency, Taxes and Charges, Payment Terms, Sales Order, Delivery Note |
| What happens on submit? | ERPNext validates, finalizes, posts accounting entries, updates outstanding amount, and may update stock |
| What happens on cancel? | ERPNext reverses/cancels server-side effects according to business rules |

## 4. Field Inventory

| Fieldname | Label EN | Label AR | ERPNext fieldtype | Required | Editable | Visibility Classification | Frontend Widget | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| naming_series | Naming Series | سلسلة التسمية | Select | Depends | Yes in draft | Required for editing | Select | Confirm series options from metadata |
| customer | Customer | العميل | Link | Yes | Yes in draft | Required for editing | Link selector | Links to Customer |
| customer_name | Customer Name | اسم العميل | Data | Server/derived | Usually no | Required for display | Read-only text | Derived from customer |
| company | Company | الشركة | Link | Yes | Yes in draft | Required for editing | Link selector | Links to Company |
| posting_date | Posting Date | تاريخ القيد | Date | Yes | Yes in draft | Required for editing | Date input | Accounting-sensitive |
| due_date | Due Date | تاريخ الاستحقاق | Date | Depends | Yes in draft | Required for editing | Date input | Often driven by payment terms |
| currency | Currency | العملة | Link | Yes | Yes in draft | Required for editing | Link selector | Links to Currency |
| conversion_rate | Conversion Rate | سعر التحويل | Float | Depends | Yes/derived | Required for display | Number input/read-only | Server validates |
| selling_price_list | Selling Price List | قائمة أسعار البيع | Link | Depends | Yes in draft | Required for editing | Link selector | Links to Price List |
| items | Items | المنتجات | Table | Yes | Yes in draft | Required for editing | Child table editor | Child doctype usually Sales Invoice Item |
| taxes | Taxes and Charges | الضرائب والرسوم | Table | Depends | Yes in draft | Required for display/editing | Child table editor | May be generated from tax template |
| payment_schedule | Payment Schedule | جدول السداد | Table | Depends | Yes in draft | Required for display | Child table editor/read-only | Depends on payment terms |
| total | Total | الإجمالي | Currency | Server | No | Required for display | Read-only currency | Server-calculated |
| net_total | Net Total | صافي الإجمالي | Currency | Server | No | Required for display | Read-only currency | Server-calculated |
| grand_total | Grand Total | الإجمالي النهائي | Currency | Server | No | Required for display | Read-only currency | Server-calculated |
| rounded_total | Rounded Total | الإجمالي بعد التقريب | Currency | Server | No | Required for display | Read-only currency | Server-calculated |
| outstanding_amount | Outstanding Amount | المبلغ المستحق | Currency | Server | No | Required for display | Read-only currency | Server-calculated |
| status | Status | الحالة | Select/Data | Server | No | Required for workflow | Status badge | Server-driven business status |
| docstatus | Docstatus | حالة المستند | Int | Server | No | Required for workflow | Status badge/internal | 0 Draft, 1 Submitted, 2 Cancelled |
| is_return | Is Return | فاتورة مرتجعة | Check | No | Yes in draft | Required for workflow | Toggle | Important for credit notes |
| update_stock | Update Stock | تحديث المخزون | Check | Depends | Yes in draft | Required for workflow | Toggle | Controls stock impact where allowed |
| debit_to | Debit To | حساب المدين | Link | Depends | Yes/derived | Required for editing | Link selector | Receivable account |
| cost_center | Cost Center | مركز التكلفة | Link | Depends | Yes/derived | Required for editing | Link selector | Accounting dimension |
| remarks | Remarks | ملاحظات | Text | No | Yes | Required for display | Textarea | Optional |
| name | Invoice ID | رقم الفاتورة | Data | Server | No | Required for display | Read-only text | ERPNext document name |
| owner | Owner | المالك | Data | Server | No | Admin/debug only | Read-only text | Audit field |
| creation | Created On | تاريخ الإنشاء | Datetime | Server | No | Admin/debug only | Read-only datetime | Audit field |
| modified | Modified On | تاريخ التعديل | Datetime | Server | No | Admin/debug only | Read-only datetime | Audit field |

## 5. Child Tables

| Child table fieldname | Child doctype | Purpose | Required | Frontend Treatment |
| --- | --- | --- | --- | --- |
| items | Sales Invoice Item | Invoice lines: item, quantity, rate, warehouse, amount, links to sales/delivery docs | Yes | Required Phase 1 child table editor |
| taxes | Sales Taxes and Charges | Tax and charge calculation rows | Depends | Required display; editable if permitted and configured |
| payment_schedule | Payment Schedule | Due dates and payment portions | Depends | Show in totals/payment section |
| payments | Sales Invoice Payment | POS or immediate payment rows depending on setup | Depends | Confirm if POS workflows are included |
| advances | Sales Invoice Advance | Advance payment allocations | Depends | Phase 2 unless needed |

### Sales Invoice Item Important Fields

| Fieldname | Purpose | Frontend Treatment |
| --- | --- | --- |
| item_code | Link to Item | Searchable link selector |
| item_name | Display item name | Read-only/derived or editable by metadata |
| description | Line description | Textarea or compact rich text |
| qty | Quantity | Number input |
| uom | Unit of measure | Link selector/select |
| rate | Unit rate | Currency input |
| amount | Line amount | Read-only server-calculated display |
| warehouse | Warehouse | Link selector when stock applies |
| sales_order | Source Sales Order | Related link/read-only when generated |
| delivery_note | Source Delivery Note | Related link/read-only when generated |
| income_account | Income account | Link selector/read-only depending on role/setup |
| cost_center | Cost center | Link selector/read-only depending on role/setup |

## 6. Relationships

| Field / Source | Links To | Relationship Type | Direction | Frontend Behavior |
| --- | --- | --- | --- | --- |
| customer | Customer | Link | Outgoing | Open customer detail |
| company | Company | Link | Outgoing | Open company if permitted |
| items.item_code | Item | Child row link | Outgoing | Open item detail |
| items.warehouse | Warehouse | Child row link | Outgoing | Open warehouse/stock view |
| items.sales_order | Sales Order | Child row link | Outgoing | Open source order |
| items.delivery_note | Delivery Note | Child row link | Outgoing | Open source delivery note |
| debit_to | Account | Link | Outgoing | Open account if permitted |
| Payment Entry.references | Payment Entry | Reference | Incoming | Show related payments |
| GL Entry.voucher_no | GL Entry | Generated record | Incoming | Show ledger entries if permitted |
| Stock Ledger Entry.voucher_no | Stock Ledger Entry | Generated record | Incoming | Show stock movement if update_stock applies and user is permitted |

## 7. Status and Lifecycle

| State | ERPNext Source | Meaning | Editable | Allowed Actions | UI Badge |
| --- | --- | --- | --- | --- | --- |
| Draft | docstatus = 0 | Invoice is not final | Yes, if permitted | Save, submit, delete if permitted | Draft |
| Submitted | docstatus = 1 | Invoice is official and posted | Usually no | Cancel, amend, print, email, create payment | Submitted |
| Cancelled | docstatus = 2 | Invoice has been cancelled | No | Amend or duplicate if permitted | Cancelled |
| Paid | status server value | Invoice is fully paid | No/limited | Print, email, view payments | Paid |
| Overdue | status server value | Invoice is unpaid past due date | No/limited | Create payment, reminders if supported | Overdue |
| Return / Credit Note | is_return = 1 or return status | Reversal/return invoice | Limited | Submit/cancel per ERPNext rules | Return |

## 8. Actions

| Action | When Available | Required Permission | Confirmation Needed | Success Behavior | Failure Behavior |
| --- | --- | --- | --- | --- | --- |
| Create | User can create Sales Invoice | Create | No | Open draft invoice | Show server error |
| Save | Draft and writable | Write | No | Refresh invoice with server totals | Show validation errors |
| Submit | Draft, valid, user can submit | Submit | Yes | Refresh to submitted state, show posted totals | Show server validation/state errors |
| Cancel | Submitted, cancellable, user can cancel | Cancel | Yes | Refresh to cancelled state | Show server validation/state errors |
| Amend | Cancelled and user can create/write | Create/Write | Yes | Open amended draft | Show server error |
| Print | Existing invoice and print permission/path available | Read/Print | No | Open print view/export | Show server error |
| Email | Existing invoice and email permission/path available | Email/Read | Maybe | Open email dialog | Show server error |
| Create Payment | Submitted with outstanding amount | Create Payment Entry | No | Open payment entry prefilled | Show server error |
| Create Return | Submitted and return allowed | Create Sales Invoice | Yes | Open return invoice | Show server error |

## 9. Permissions

| Permission Area | Frontend Behavior |
| --- | --- |
| Read | Show list/detail only if allowed |
| Create | Show create invoice action |
| Write | Enable draft fields only when writable |
| Submit | Show submit action only when draft and valid by server-permitted state |
| Cancel | Show cancel action only when submitted and permitted |
| Accounts fields | Hide or read-only for users without accounting access |
| Stock fields | Show warehouse/update stock fields according to metadata, role, and setup |
| Reports/ledger | Show ledger links only if user can access them |

## 10. API Mapping

Confirm exact endpoints against the ERPNext/Frappe version in use.

| Operation | Endpoint / Method | UI Mapping |
| --- | --- | --- |
| List | Resource list for Sales Invoice | Invoice table with filters, status, pagination |
| Detail | Resource detail for Sales Invoice by name | Invoice detail page with child tables |
| Create | Resource create for Sales Invoice | Create invoice form |
| Update | Resource update for Sales Invoice by name | Draft edit form |
| Submit | ERPNext/Frappe document submit method | Workflow action |
| Cancel | ERPNext/Frappe document cancel method | Workflow action |
| Amend | ERPNext/Frappe amend/copy behavior, confirm exact method | Amend action |
| Metadata | Doctype metadata for Sales Invoice and child doctypes | Form and child table rendering |
| Print | ERPNext print/export endpoint | Print action |
| Related payments | Filtered Payment Entry query/report | Related payments panel |
| Ledger entries | Filtered GL Entry query/report | Accounting panel if permitted |
| Stock movement | Filtered Stock Ledger query/report | Stock panel if relevant/permitted |

## 11. Validation Rules

| Rule | Source | Client Guidance | Server Truth |
| --- | --- | --- | --- |
| Customer required | Metadata/server validation | Require customer before save/submit | ERPNext validates |
| Company required | Metadata/server validation | Require company | ERPNext validates |
| At least one item row required | Server validation | Prevent empty item table submission | ERPNext validates |
| Item quantity must be valid | Server validation | Validate positive/nonzero quantity where expected | ERPNext validates |
| Stock availability may be required | Stock validation/setup | Show server stock errors clearly | ERPNext validates |
| Taxes and totals are server-calculated | Server calculation | Display provisional values only as UI guidance if used | ERPNext validates/calculates |
| Accounting period and fiscal rules apply | Server validation | Show blocking errors from server | ERPNext validates |
| Credit limit may apply | Server validation/setup | Show warning/error from server | ERPNext validates |
| Submitted invoices are not freely editable | docstatus/server rules | Disable fields after submit | ERPNext enforces |

## 12. Frontend Requirements

| Feature | Required | Notes |
| --- | --- | --- |
| List page | Yes | Search by invoice, customer, status, posting date |
| Detail page | Yes | Header, status, totals, items, taxes, related docs |
| Create form | Yes | Full draft invoice form |
| Edit form | Yes | Draft only unless ERPNext permits specific edits |
| Workflow action bar | Yes | Save, submit, cancel, amend, print, email, create payment |
| Child table editor | Yes | Items required; taxes/payment schedule as configured |
| Related documents panel | Yes | Customer, sales order, delivery note, payments, ledger |
| Timeline/comments | Maybe | Useful for audit; Phase 2 if not needed for MVP |
| Attachments | Maybe | Needed if invoice attachments are operationally required |
| Print/export | Yes | Important for invoicing |
| Reports/dashboard cards | Yes | Sales totals, outstanding, overdue |

## 13. Screen Notes

### List Page

- Show invoice number, customer, posting date, due date, grand total, outstanding amount, status, docstatus.
- Filters should include status, customer, company, posting date range, overdue/outstanding where supported.
- Row click opens detail.

### Detail Page

- Header must show invoice number, customer, status, docstatus, grand total, outstanding amount.
- Tabs or sections should include Items, Taxes, Payment Schedule, Related Documents, Ledger/Stock where permitted.
- Server-calculated totals must be visually clear and refreshed after save/submit/cancel.

### Form Page

- Use metadata-aware fields.
- Child rows must submit backend-compatible payloads.
- Link selectors must search ERPNext data.
- Server validation errors must map to global and field-level messages when possible.

## 14. Done Checklist

- [ ] Metadata verified for Sales Invoice.
- [ ] Metadata verified for Sales Invoice Item.
- [ ] Required fields confirmed.
- [ ] Submit/cancel/amend methods confirmed.
- [ ] Child table payload structure confirmed.
- [ ] Totals display uses server values after save.
- [ ] Customer, Item, Warehouse, Account links implemented.
- [ ] Permission behavior confirmed.
- [ ] Print/export behavior confirmed.
- [ ] Server validation errors displayed clearly.
- [ ] Related payments, ledger, and stock movement strategy confirmed.


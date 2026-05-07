# Doctype Specification: Customer

Status: Draft v1  
Phase: 1  
Last updated: 2026-04-21  
Note: Verify all fields and permissions against the target ERPNext instance metadata before implementation.

## 1. Basic Information

| Field | Value |
| --- | --- |
| Doctype name | Customer |
| Module | Selling / CRM |
| Type | Master |
| Submittable | No |
| Phase | 1 |

## 2. Purpose

### EN

Customer stores the master record for a buying party. It is used across quotations, sales orders, delivery notes, sales invoices, payments, contacts, addresses, pricing, taxes, and reporting.

### AR

يحفظ Customer السجل الأساسي للعميل الذي يشتري من الشركة. يستخدم في عروض الأسعار وأوامر البيع ومذكرات التسليم وفواتير البيع والدفعات وجهات الاتصال والعناوين والتسعير والضرائب والتقارير.

## 3. Business Context

| Question | Answer |
| --- | --- |
| Who uses it? | Sales users, sales managers, accounts users, admin |
| When is it created? | Before creating quotations, sales orders, or invoices for a new customer |
| What process does it start? | Customer-facing sales lifecycle |
| What records depend on it? | Quotation, Sales Order, Delivery Note, Sales Invoice, Payment Entry, Contact, Address |
| What records does it depend on? | Customer Group, Territory, Currency, Payment Terms, Sales Partner, Account Manager, Contact, Address depending on configuration |
| What happens if disabled? | It should no longer be used for new transactions while old records remain linked |

## 4. Field Inventory

| Fieldname | Label EN | Label AR | ERPNext fieldtype | Required | Editable | Visibility Classification | Frontend Widget | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| customer_name | Customer Name | اسم العميل | Data | Yes | Yes | Required for editing | Text input | Primary human-readable name |
| customer_type | Customer Type | نوع العميل | Select | Usually yes | Yes | Required for editing | Select | Common values include Company and Individual; confirm options from metadata |
| customer_group | Customer Group | مجموعة العملاء | Link | Usually yes | Yes | Required for editing | Link selector | Links to Customer Group |
| territory | Territory | المنطقة | Link | Usually yes | Yes | Required for editing | Link selector | Links to Territory |
| disabled | Disabled | معطل | Check | No | Yes | Required for workflow | Toggle | Controls whether customer can be used operationally |
| default_currency | Default Currency | العملة الافتراضية | Link | No | Yes | Required for editing | Link selector | Links to Currency |
| default_price_list | Default Price List | قائمة الأسعار الافتراضية | Link | No | Yes | Required for editing | Link selector | Depends on selling setup |
| payment_terms | Payment Terms | شروط الدفع | Link | No | Yes | Required for editing | Link selector | Links to Payment Terms Template if configured |
| customer_primary_contact | Primary Contact | جهة الاتصال الأساسية | Link | No | Yes | Required for display | Link selector | Links to Contact |
| customer_primary_address | Primary Address | العنوان الأساسي | Link | No | Yes | Required for display | Link selector | Links to Address |
| email_id | Email | البريد الإلكتروني | Data | No | Yes | Required for display | Email input | Confirm whether stored directly or through Contact in target instance |
| mobile_no | Mobile No | رقم الجوال | Data | No | Yes | Required for display | Phone input | Confirm target metadata |
| tax_id | Tax ID | الرقم الضريبي | Data | Depends | Yes | Required for editing | Text input | Important for invoices and compliance |
| customer_details | Customer Details | تفاصيل العميل | Text | No | Yes | Required for display | Textarea | Optional notes |
| name | Document ID | معرف المستند | Data | Server | No | Admin/debug only | Read-only text | ERPNext document name |
| owner | Owner | المالك | Data | Server | No | Admin/debug only | Read-only text | Audit field |
| creation | Created On | تاريخ الإنشاء | Datetime | Server | No | Admin/debug only | Read-only datetime | Audit field |
| modified | Modified On | تاريخ التعديل | Datetime | Server | No | Admin/debug only | Read-only datetime | Audit field |

## 5. Child Tables

| Child table fieldname | Child doctype | Purpose | Required | Frontend Treatment |
| --- | --- | --- | --- | --- |
| sales_team | Sales Team | Assign sales users or contribution splits | No | Phase 2 unless required by sales process |
| credit_limits | Customer Credit Limit | Customer-specific credit limits per company | Depends | Show for accounts/admin users if enabled |
| companies / accounts | Customer company/account defaults | Accounting defaults | Depends | Confirm from metadata and accounting setup |

## 6. Relationships

| Field / Source | Links To | Relationship Type | Direction | Frontend Behavior |
| --- | --- | --- | --- | --- |
| customer_group | Customer Group | Link | Outgoing | Clickable link selector |
| territory | Territory | Link | Outgoing | Clickable link selector |
| customer_primary_contact | Contact | Link | Outgoing | Open contact details |
| customer_primary_address | Address | Link | Outgoing | Open address details |
| Sales Invoice.customer | Sales Invoice | Link | Incoming | Show related invoices |
| Sales Order.customer | Sales Order | Link | Incoming | Show related orders |
| Payment Entry.party | Payment Entry | Dynamic relation | Incoming | Show related payments where party type is Customer |

## 7. Status and Lifecycle

Customer is a master doctype, not a submitted transaction.

| State | Meaning | Editable | Allowed Actions | UI Badge |
| --- | --- | --- | --- | --- |
| Active | Customer can be used in new transactions | Yes, if permitted | Save, create transaction | Active |
| Disabled | Customer should not be used for new transactions | Limited | Enable if permitted | Disabled |

## 8. Actions

| Action | When Available | Required Permission | Confirmation Needed | Success Behavior |
| --- | --- | --- | --- | --- |
| Create | User has create permission | Create | No | Open created customer |
| Save | User has write permission | Write | No | Refresh customer |
| Disable | Active customer, user has write permission | Write | Yes | Show disabled state |
| Enable | Disabled customer, user has write permission | Write | No | Show active state |
| Create Quotation | Customer exists and user can create Quotation | Create on Quotation | No | Start quotation with customer prefilled |
| Create Sales Order | Customer exists and user can create Sales Order | Create on Sales Order | No | Start sales order with customer prefilled |
| Create Sales Invoice | Customer exists and user can create Sales Invoice | Create on Sales Invoice | No | Start invoice with customer prefilled |

## 9. Permissions

| Permission Area | Frontend Behavior |
| --- | --- |
| Read | Show customer list/detail only if allowed |
| Create | Show create customer action |
| Write | Enable editable fields |
| Delete | Avoid prominent delete; only show if explicitly permitted and safe |
| Linked document creation | Show create linked record actions only when user has permission for target doctype |

## 10. API Mapping

Confirm exact endpoints against the ERPNext/Frappe version in use.

| Operation | Endpoint / Method | UI Mapping |
| --- | --- | --- |
| List | Resource list for Customer | Customer table with filters and pagination |
| Detail | Resource detail for Customer by name | Customer detail page |
| Create | Resource create for Customer | Customer create form |
| Update | Resource update for Customer by name | Customer edit form |
| Metadata | Doctype metadata for Customer | Field rendering, labels, required/read-only rules |
| Related documents | Filtered lists by customer field | Related documents panel |

## 11. Validation Rules

| Rule | Source | Client Guidance | Server Truth |
| --- | --- | --- | --- |
| Customer name required | Metadata/server validation | Mark field required | ERPNext validates |
| Customer Group required depending on setup | Metadata/server validation | Mark field required when metadata says so | ERPNext validates |
| Territory required depending on setup | Metadata/server validation | Mark field required when metadata says so | ERPNext validates |
| Tax ID may be required by localization/setup | Server/custom validation | Show when required by metadata or server error | ERPNext validates |
| Disabled customer should not be used in new transactions | Server validation/business behavior | Warn or prevent selection if API indicates disabled | ERPNext validates |

## 12. Frontend Requirements

| Feature | Required | Notes |
| --- | --- | --- |
| List page | Yes | Search by name, group, territory, status |
| Detail page | Yes | Summary, contact/address, related sales records |
| Create form | Yes | Required master fields |
| Edit form | Yes | Permission-aware |
| Workflow action bar | No | Use simple master action bar |
| Child table editor | Maybe | Credit limits/sales team if enabled |
| Related documents panel | Yes | Sales orders, invoices, payments |
| Timeline/comments | Maybe | Phase 2 unless needed |
| Attachments | Maybe | Phase 2 |
| Print/export | Maybe | Export list; print is not primary |

## 13. Done Checklist

- [ ] Metadata verified from target ERPNext.
- [ ] Required fields confirmed.
- [ ] Contact and Address behavior confirmed.
- [ ] Customer Group and Territory selectors implemented.
- [ ] Disabled state represented.
- [ ] Related sales documents shown.
- [ ] Permissions respected.
- [ ] Server validation errors displayed.


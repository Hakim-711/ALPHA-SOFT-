# Doctype Specification: Item

Status: Draft v1  
Phase: 1  
Last updated: 2026-04-21  
Note: Verify all fields and permissions against the target ERPNext instance metadata before implementation.

## 1. Basic Information

| Field | Value |
| --- | --- |
| Doctype name | Item |
| Module | Stock / Selling / Buying |
| Type | Master |
| Submittable | No |
| Phase | 1 |

## 2. Purpose

### EN

Item stores the master record for a product, service, or stock unit. It is used across sales, purchase, stock, pricing, valuation, taxes, warehouses, and reporting.

### AR

يحفظ Item السجل الأساسي للمنتج أو الخدمة أو وحدة المخزون. يستخدم في البيع والشراء والمخزون والتسعير والتقييم والضرائب والمستودعات والتقارير.

## 3. Business Context

| Question | Answer |
| --- | --- |
| Who uses it? | Stock users, sales users, purchase users, accounts users, admin |
| When is it created? | Before using a product/service in sales, purchase, or stock transactions |
| What process does it support? | Sales, purchase, stock movement, pricing, valuation |
| What records depend on it? | Sales Order Item, Sales Invoice Item, Purchase Order Item, Stock Entry Detail, Stock Ledger Entry, Item Price |
| What records does it depend on? | Item Group, Stock UOM, Warehouse, Brand, Price Lists, Accounts, Taxes depending on setup |
| What happens if disabled? | It should not be selected for new transactions while historical records remain linked |

## 4. Field Inventory

| Fieldname | Label EN | Label AR | ERPNext fieldtype | Required | Editable | Visibility Classification | Frontend Widget | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| item_code | Item Code | رمز المنتج | Data | Yes | Usually limited after use | Required for editing | Text input | Primary identifier; may be naming-series driven |
| item_name | Item Name | اسم المنتج | Data | Yes | Yes | Required for editing | Text input | Human-readable name |
| item_group | Item Group | مجموعة المنتجات | Link | Usually yes | Yes | Required for editing | Link selector | Links to Item Group |
| stock_uom | Stock UOM | وحدة المخزون | Link | Usually yes | Yes | Required for editing | Link selector | Links to UOM |
| is_stock_item | Maintain Stock | يتطلب مخزون | Check | No | Yes | Required for workflow | Toggle | Drives stock behavior |
| disabled | Disabled | معطل | Check | No | Yes | Required for workflow | Toggle | Prevents normal use in new transactions |
| description | Description | الوصف | Text Editor / Text | No | Yes | Required for display | Textarea/rich text | May appear on transactions and print formats |
| brand | Brand | العلامة التجارية | Link | No | Yes | Required for display | Link selector | Optional |
| standard_rate | Standard Rate | السعر القياسي | Currency | No | Yes | Required for display | Currency input | Confirm pricing strategy; Item Price may be source of selling prices |
| valuation_rate | Valuation Rate | معدل التقييم | Currency | Server/setup | Limited | Required for display | Read-only currency | Server/accounting-sensitive |
| opening_stock | Opening Stock | المخزون الافتتاحي | Float | No | Limited | Required for editing | Number input | Usually only during setup; confirm rules |
| default_warehouse | Default Warehouse | المستودع الافتراضي | Link | No | Yes | Required for editing | Link selector | Links to Warehouse |
| has_variants | Has Variants | له متغيرات | Check | No | Yes | Required for workflow | Toggle | Affects variant handling |
| variant_of | Variant Of | متغير من | Link | No | Yes | Required for display | Link selector | Links to template Item |
| name | Document ID | معرف المستند | Data | Server | No | Admin/debug only | Read-only text | ERPNext document name |
| owner | Owner | المالك | Data | Server | No | Admin/debug only | Read-only text | Audit field |
| creation | Created On | تاريخ الإنشاء | Datetime | Server | No | Admin/debug only | Read-only datetime | Audit field |
| modified | Modified On | تاريخ التعديل | Datetime | Server | No | Admin/debug only | Read-only datetime | Audit field |

## 5. Child Tables

| Child table fieldname | Child doctype | Purpose | Required | Frontend Treatment |
| --- | --- | --- | --- | --- |
| uoms | UOM Conversion Detail | Alternative units and conversion factors | Depends | Phase 1 if multi-UOM is used |
| item_defaults | Item Default | Company-specific warehouse, accounts, buying/selling defaults | Depends | Required when target setup needs company defaults |
| barcodes | Item Barcode | Barcode values for scanning/search | No | Phase 2 unless barcode workflows are required |
| supplier_items | Item Supplier | Supplier-specific item references | No | Phase 2 or purchase phase |
| taxes | Item Tax | Item-specific tax templates | Depends | Show when sales tax setup needs it |

## 6. Relationships

| Field / Source | Links To | Relationship Type | Direction | Frontend Behavior |
| --- | --- | --- | --- | --- |
| item_group | Item Group | Link | Outgoing | Clickable link selector |
| stock_uom | UOM | Link | Outgoing | Clickable link selector |
| default_warehouse | Warehouse | Link | Outgoing | Clickable link selector |
| variant_of | Item | Link | Outgoing | Link to template item |
| Sales Invoice Item.item_code | Sales Invoice | Child row relation | Incoming | Show related transactions in item activity |
| Stock Ledger Entry.item_code | Stock Ledger Entry | Generated record | Incoming | Show stock movement where permitted |
| Bin.item_code | Bin / Warehouse balance | Generated/server record | Incoming | Show stock by warehouse |

## 7. Status and Lifecycle

Item is a master doctype, not a submitted transaction.

| State | Meaning | Editable | Allowed Actions | UI Badge |
| --- | --- | --- | --- | --- |
| Active | Item can be selected in transactions | Yes, if permitted | Save, create transaction | Active |
| Disabled | Item should not be selected in new transactions | Limited | Enable if permitted | Disabled |
| Template | Item defines variants | Yes, if permitted | Create variant | Template |
| Variant | Item is a variant of a template | Yes, if permitted | View template | Variant |

## 8. Actions

| Action | When Available | Required Permission | Confirmation Needed | Success Behavior |
| --- | --- | --- | --- | --- |
| Create | User has create permission | Create | No | Open created item |
| Save | User has write permission | Write | No | Refresh item |
| Disable | Active item, user has write permission | Write | Yes | Show disabled state |
| Enable | Disabled item, user has write permission | Write | No | Show active state |
| View Stock Balance | Item exists and user can read stock data | Read stock reports/records | No | Open stock balance view |
| View Stock Ledger | Item exists and user can read ledger | Read stock ledger/report | No | Open stock movement view |
| Create Sales Invoice | Item exists and user can create Sales Invoice | Create on Sales Invoice | No | Start invoice with item prefilled |

## 9. Permissions

| Permission Area | Frontend Behavior |
| --- | --- |
| Read | Show item list/detail only if allowed |
| Create | Show create item action |
| Write | Enable editable fields |
| Delete | Avoid prominent delete; item history often makes deletion unsafe |
| Stock data | Show stock balances only if stock permissions allow |
| Accounts defaults | Show accounting fields only for permitted roles |

## 10. API Mapping

Confirm exact endpoints against the ERPNext/Frappe version in use.

| Operation | Endpoint / Method | UI Mapping |
| --- | --- | --- |
| List | Resource list for Item | Item table with filters and pagination |
| Detail | Resource detail for Item by name | Item detail page |
| Create | Resource create for Item | Item create form |
| Update | Resource update for Item by name | Item edit form |
| Metadata | Doctype metadata for Item | Field rendering, labels, required/read-only rules |
| Stock balance | Report or approved stock endpoint | Item stock summary |
| Stock ledger | Report or approved stock endpoint | Item movement table |

## 11. Validation Rules

| Rule | Source | Client Guidance | Server Truth |
| --- | --- | --- | --- |
| Item code/name required | Metadata/server validation | Mark fields required | ERPNext validates |
| Item Group required depending on setup | Metadata/server validation | Mark required when metadata says so | ERPNext validates |
| Stock UOM required | Metadata/server validation | Mark required | ERPNext validates |
| Cannot freely change stock-sensitive fields after transactions | Server validation | Disable or warn when item has ledger history if API provides signal | ERPNext validates |
| Disabled item should not be selected in new transactions | Server validation/business behavior | Filter disabled items from selectors where appropriate | ERPNext validates |

## 12. Frontend Requirements

| Feature | Required | Notes |
| --- | --- | --- |
| List page | Yes | Search by code, name, group, disabled state |
| Detail page | Yes | Summary, stock, prices, related transactions |
| Create form | Yes | Required master fields |
| Edit form | Yes | Permission-aware |
| Workflow action bar | No | Use master action bar |
| Child table editor | Yes | UOM/defaults if enabled |
| Related documents panel | Yes | Sales, purchase, stock movement |
| Timeline/comments | Maybe | Phase 2 unless needed |
| Attachments | Maybe | Product image/assets may be needed later |
| Print/export | Maybe | Export list; print is not primary |

## 13. Done Checklist

- [ ] Metadata verified from target ERPNext.
- [ ] Required fields confirmed.
- [ ] Item Group, UOM, Warehouse selectors implemented.
- [ ] Disabled state represented.
- [ ] Stock balance display uses server data.
- [ ] Stock ledger display uses server data.
- [ ] Item child tables handled where required.
- [ ] Permissions respected.
- [ ] Server validation errors displayed.


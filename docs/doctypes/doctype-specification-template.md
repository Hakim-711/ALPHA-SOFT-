# Doctype Specification Template

Use this template for every ERPNext Doctype included in alpha-neqat.

This document must be completed from the target ERPNext instance metadata, workflow rules, permissions, and real API behavior. Do not rely only on memory or assumptions.

## 1. Basic Information

| Field | Value |
| --- | --- |
| Doctype name |  |
| Module |  |
| Type | Master / Transaction / Child Table / Setup / Report-supporting |
| Submittable | Yes / No |
| Phase | 1 / 2 / 3 / Later |
| Owner |  |
| Last verified against ERPNext |  |

## 2. Purpose

### EN

Describe what this document exists for in the business process.

### AR

اشرح وظيفة هذا المستند داخل العملية التجارية.

## 3. Business Context

| Question | Answer |
| --- | --- |
| Who uses it? |  |
| When is it created? |  |
| What process does it start, continue, or finish? |  |
| What records depend on it? |  |
| What records does it depend on? |  |
| What happens when it is submitted, cancelled, disabled, or deleted? |  |

## 4. Field Inventory

Visibility classification must be one of:

- Required for display
- Required for editing
- Required for workflow
- Admin/debug only
- Internal only

| Fieldname | Label EN | Label AR | ERPNext fieldtype | Required | Editable | Read-only | Hidden | Options / Link Target | Depends On | Visibility Classification | Frontend Widget | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |  |  |  |  |

## 5. Child Tables

| Child table fieldname | Child doctype | Purpose | Required | Editable | Row actions | Important fields | Payload notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |

## 6. Relationships

| Field / Source | Links To | Relationship Type | Direction | Frontend Behavior |
| --- | --- | --- | --- | --- |
|  |  | Link / Dynamic Link / Child Row / Generated Record / Reported Record | Incoming / Outgoing |  |

## 7. Status and Lifecycle

| State | ERPNext Source | Meaning | Editable | Allowed Actions | UI Badge |
| --- | --- | --- | --- | --- | --- |
| Draft | docstatus = 0 | Not submitted | Yes, if permitted | Save, Submit, Delete if permitted | Draft |
| Submitted | docstatus = 1 | Official business record | Usually limited | Cancel, Amend, Print, Create linked document | Submitted |
| Cancelled | docstatus = 2 | Cancelled official record | No | Amend or duplicate if permitted | Cancelled |

Add custom workflow states if the instance uses ERPNext Workflow.

## 8. Actions

| Action | When Available | Required Permission | API / Method | Confirmation Needed | Success Behavior | Failure Behavior |
| --- | --- | --- | --- | --- | --- | --- |
| Save | Draft and editable | Write / Create |  | No | Refresh document | Show validation errors |
| Submit | Draft and submittable | Submit |  | Yes | Refresh document, show submitted state | Show server error |
| Cancel | Submitted and cancellable | Cancel |  | Yes | Refresh document, show cancelled state | Show server error |

## 9. Permissions

| Permission Area | Source | Frontend Behavior |
| --- | --- | --- |
| Can read | ERPNext permissions/API response | Show or block page and menu |
| Can create | ERPNext permissions/API response | Show or hide create action |
| Can write | ERPNext permissions/API response | Enable or disable form fields |
| Can submit | ERPNext permissions/API response | Show submit action only when valid |
| Can cancel | ERPNext permissions/API response | Show cancel action only when valid |
| Field-level restrictions | ERPNext metadata/permissions | Hide, disable, or mark read-only |

## 10. API Mapping

Confirm exact endpoints and payloads against the target ERPNext version.

| Operation | Endpoint / Method | Request Shape | Response Shape | Notes |
| --- | --- | --- | --- | --- |
| List |  |  |  | Filters, fields, pagination |
| Detail |  |  |  | Include child tables |
| Create |  |  |  | Backend assigns naming series if configured |
| Update |  |  |  | Draft vs submitted behavior differs |
| Submit |  |  |  | Submittable documents only |
| Cancel |  |  |  | Submittable documents only |
| Metadata |  |  |  | Field definitions, required, read-only, options |
| Reports |  |  |  | If applicable |

## 11. Validation Rules

| Rule | Source | Client Guidance | Server Truth | UI Error Behavior |
| --- | --- | --- | --- | --- |
|  | Metadata / server validation / workflow / custom script |  |  |  |

## 12. Frontend Requirements

| Feature | Required | Notes |
| --- | --- | --- |
| List page | Yes / No |  |
| Detail page | Yes / No |  |
| Create form | Yes / No |  |
| Edit form | Yes / No |  |
| Workflow action bar | Yes / No |  |
| Child table editor | Yes / No |  |
| Related documents panel | Yes / No |  |
| Timeline/comments | Yes / No |  |
| Attachments | Yes / No |  |
| Print/export | Yes / No |  |
| Reports/dashboard cards | Yes / No |  |

## 13. Screen Requirements

### List Page

- Title
- Search
- Filters
- Sort
- Pagination
- Status badges
- Row actions
- Empty state
- Loading state
- Error state

### Detail Page

- Summary header
- Status and docstatus
- Important fields
- Linked records
- Related documents
- Timeline, comments, or attachments when required
- Server-calculated values
- Workflow actions

### Create/Edit Form

- Required fields
- Read-only fields
- Link selectors
- Child table editor
- Validation panel
- Save/submit actions
- Server error mapping

## 14. Done Checklist

- [ ] Field inventory verified from ERPNext metadata.
- [ ] Required, hidden, read-only, and depends-on behavior documented.
- [ ] Child table payload structure documented.
- [ ] Link fields and related doctypes documented.
- [ ] Lifecycle and workflow actions documented.
- [ ] Permissions documented.
- [ ] API operations documented.
- [ ] Validation and server error behavior documented.
- [ ] Frontend pages and components defined.
- [ ] Loading, empty, error, and permission-denied states defined.
- [ ] Reviewed by product/operations owner.


# UI Upgrade Report

Date: 2026-04-21  
Scope: Modern premium UI pass for alpha-neqat Customer module and admin shell.

## 1. Admin Shell

### Current UI Problems

The shell was functional but visually flat. Navigation items were not grouped, the top bar had little operational value, and disabled modules did not communicate roadmap state.

### UX Problems

Users had no global search affordance, no profile/notification area, and no clear indication that ERPNext remains the connected backend source.

### Improvement Plan

Upgrade the sidebar into grouped navigation, add a sticky top bar with global search, connection status, notification button, and profile menu affordance.

### Updated Code

- `src/app/router/admin-layout.tsx`
- `src/index.css`

### Reusable Components

- Existing layout classes were upgraded into shell-level design patterns.

### Notes

The shell remains responsive: sidebar collapses into stacked navigation on tablet/mobile.

## 2. Customer List Screen

### Current UI Problems

The list page had filters and a table, but lacked a premium information hierarchy and did not highlight useful operational totals.

### UX Problems

Users could not quickly understand how many records were active, disabled, or company accounts on the current page.

### Improvement Plan

Add breadcrumbs, metric cards, better filters, a stronger empty state with a primary action, and polished table styling.

### Updated Code

- `src/features/customers/pages/customers-list-page.tsx`
- `src/features/customers/components/customers-table.tsx`
- `src/index.css`

### Reusable Components

- `src/shared/ui/breadcrumbs.tsx`
- `src/shared/ui/metric-card.tsx`
- `src/shared/ui/skeleton.tsx`

### Notes

Metrics are page-level summaries, not backend totals. Backend aggregate reporting can be added later through ERPNext reports.

## 3. Customer Form

### Current UI Problems

The form worked but felt like raw fields. Field grouping, guidance, and ERP-aware explanation were too light.

### UX Problems

Users needed clearer context about which fields are ERPNext link fields and which rules are server-owned.

### Improvement Plan

Add a document-editor layout with grouped sections, inline hints, stronger validation states, and a side panel explaining ERPNext customer rules.

### Updated Code

- `src/features/customers/components/customer-form.tsx`
- `src/index.css`

### Reusable Components

- Existing form classes were expanded into `form-content`, `form-main`, and `form-aside` patterns.

### Notes

Business logic and API payload behavior were preserved.

## 4. Customer Detail Screen

### Current UI Problems

The detail page displayed correct data but lacked hierarchy and mixed related-document cards inside another framed panel.

### UX Problems

Important identity, status, type, group, and territory information was not scan-friendly enough.

### Improvement Plan

Add breadcrumbs, header metadata, compact metric cards, a richer summary block, and an unframed related-document section to avoid nested cards.

### Updated Code

- `src/features/customers/pages/customer-details-page.tsx`
- `src/features/customers/components/customer-related-panel.tsx`
- `src/index.css`

### Reusable Components

- `Breadcrumbs`
- `MetricCard`
- `Badge`

### Notes

Related documents still come from ERPNext resource queries and show errors independently when those doctypes are unavailable or restricted.

## 5. Loading, Empty, and Error States

### Current UI Problems

Feedback states existed but were visually basic.

### UX Problems

Loading did not give a strong sense of structure, and empty states did not always guide the next action.

### Improvement Plan

Add skeleton loading, more polished error/empty cards, and optional empty-state actions.

### Updated Code

- `src/shared/ui/loading.tsx`
- `src/shared/ui/error-state.tsx`
- `src/shared/ui/empty-state.tsx`
- `src/shared/ui/skeleton.tsx`
- `src/index.css`

### Reusable Components

- `SkeletonTable`
- `Loading`
- `ErrorState`
- `EmptyState`

### Notes

Animations are subtle and limited to loading feedback.


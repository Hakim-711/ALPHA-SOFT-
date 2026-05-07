# Code Quality Update

Date: 2026-04-21  
Scope: Production hardening pass for the React + ERPNext Customer foundation.

## 1. API Environment and Auth

### Problem

The HTTP client could attach browser-exposed API key and secret headers whenever the variables existed.

### Cause

Vite environment variables are bundled into browser code. A direct `VITE_FRAPPE_API_SECRET` is not safe for public deployments unless the app is strictly internal and controlled.

### Fix

Browser token auth is now disabled by default and must be explicitly enabled with `VITE_ENABLE_BROWSER_TOKEN_AUTH=true`. The default path is same-origin `/api`, intended for a backend proxy or ERPNext session flow.

### Updated Code

- `src/core/config/env.ts`
- `src/core/api/http.ts`
- `.env.example`

### Notes

For public production deployments, use a backend proxy/session flow rather than browser-exposed API secrets.

## 2. API Base URL Normalization

### Problem

An API base value ending in `/api` could accidentally become `/api/api`.

### Cause

The HTTP client appended `/api` unconditionally when `apiBaseUrl` was set.

### Fix

The HTTP client now normalizes the API root and only appends `/api` when the configured base URL does not already end with it.

### Updated Code

- `src/core/api/http.ts`

### Notes

This supports both `VITE_API_BASE_URL=https://erp.example.com` and `VITE_API_BASE_URL=https://erp.example.com/api`.

## 3. ERPNext Link Fields

### Problem

Customer Group, Territory, and Primary Address behaved like plain text fields.

### Cause

The first Customer form version did not yet have a reusable way to load ERPNext resource names for link-field suggestions.

### Fix

Added a reusable resource-name API and `useLinkOptions` hook, then connected Customer Group, Territory, and Address suggestions to ERPNext resource endpoints.

### Updated Code

- `src/core/api/resource.ts`
- `src/shared/hooks/use-link-options.ts`
- `src/features/customers/components/customer-form.tsx`

### Notes

This is still a starter link-field implementation. The next production step is a richer async combobox with debounce, keyboard navigation, permission-aware errors, and metadata-driven link targets.

## 4. Customer Primary Address Mapping

### Problem

The Customer API mapping used a generic `primary_address` field while ERPNext Customer commonly stores the primary address link in `customer_primary_address`.

### Cause

The frontend field was named from the simplified product spec, while the backend-aware mapping should preserve ERPNext's fieldname.

### Fix

Customer list/detail payload mapping now uses `customer_primary_address`, while the UI can still display it as Primary Address.

### Updated Code

- `src/features/customers/types/customer.types.ts`
- `src/features/customers/api/customers.api.ts`
- `src/features/customers/pages/customer-details-page.tsx`

### Notes

The target ERPNext instance metadata should still be verified before this field becomes mandatory or hidden in production.


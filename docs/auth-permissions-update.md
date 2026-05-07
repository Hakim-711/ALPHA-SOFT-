# Auth and Permissions Update

Date: 2026-04-21  
Scope: ERPNext authentication/session and first permission-aware UI layer.

## 1. Authentication

### Problem

The application could call ERPNext resources but had no explicit login/session layer.

### Cause

The first Customer module focused on document UI and API mapping before user identity was introduced.

### Fix

Added ERPNext login/logout/session APIs, an `AuthProvider`, a login page, and route protection.

### Updated Code

- `src/features/auth/api/auth.api.ts`
- `src/features/auth/context/auth-context.tsx`
- `src/features/auth/pages/login-page.tsx`
- `src/app/router/protected-route.tsx`
- `src/app/router/index.tsx`
- `src/main.tsx`

### Notes

The implementation uses ERPNext/Frappe session behavior through `/api/method/login`, `/api/method/logout`, and `/api/method/frappe.auth.get_logged_user`.

## 2. Protected Routes

### Problem

ERP pages were accessible without confirming user session.

### Cause

Routes were rendered directly under the admin shell.

### Fix

Admin routes now render through `ProtectedRoute`. Unauthenticated users are redirected to `/login` and returned to the requested route after login.

### Updated Code

- `src/app/router/index.tsx`
- `src/app/router/protected-route.tsx`

### Notes

The login page is intentionally outside the admin shell.

## 3. Doctype Permission Layer

### Problem

Create/edit/disable controls were not connected to a central permission interpretation layer.

### Cause

Customer permissions were previously unknown placeholders.

### Fix

Added `getDoctypePermissions` and `useDoctypePermissions`, which try to query ERPNext permission state through `frappe.client.has_permission`. Customer permissions now map through this layer.

### Updated Code

- `src/features/permissions/api/permissions.api.ts`
- `src/features/permissions/hooks/use-doctype-permissions.ts`
- `src/features/permissions/types/permissions.types.ts`
- `src/features/customers/hooks/use-customer-permissions.ts`

### Notes

If the permission endpoint is unavailable or restricted, the UI falls back to `unknown` instead of pretending to be authoritative. ERPNext still enforces all final permissions on the server.

## 4. Sidebar and Logout

### Problem

The shell did not display the current user or provide logout.

### Cause

The shell had no session context.

### Fix

The admin shell now reads the session user, shows their name/initial, supports logout, and hides Customer navigation if the server explicitly denies read permission.

### Updated Code

- `src/app/router/admin-layout.tsx`

### Notes

Future modules should add their DocType permissions to the same centralized layer.


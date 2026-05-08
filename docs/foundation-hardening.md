# Foundation Hardening

Date: 2026-05-08

## Decision

The project is now in a temporary feature freeze.  
The current priority is to stabilize ALPHA-SOFT as a production-grade ERPNext experience layer before adding more modules.

## Completed in this pass

### 1. Frontend secret hardening

Removed browser API token injection from the HTTP client.

Frontend now uses:

- same-origin `/api`
- ERPNext session cookies
- reverse proxy or backend-for-frontend when needed

Removed from `.env.example`:

- `VITE_ENABLE_BROWSER_TOKEN_AUTH`
- `VITE_FRAPPE_API_KEY`
- `VITE_FRAPPE_API_SECRET`

Reason: any `VITE_*` value is bundled into browser code and must not contain secrets.

### 2. Login redirect hardening

Login return path now accepts only safe internal paths:

- must start with `/`
- must not start with `//`
- must not redirect back to `/login`

This prevents unsafe redirect behavior and login loops.

### 3. CI

Added GitHub Actions:

```text
.github/workflows/ci.yml
```

CI runs:

```bash
npm run verify
```

Which includes:

- lint
- typecheck
- build

### 4. README

Replaced the Vite template README with a real project README covering:

- project vision
- setup
- env rules
- scripts
- architecture
- current modules
- development rules
- current priorities

### 5. Layout refactor

Moved admin navigation items and sections into:

```text
src/app/router/navigation.tsx
```

This reduces growth pressure on `admin-layout.tsx` and creates a clearer place for future permission-aware navigation rules.

## Still pending in Foundation Hardening

- Split topbar metadata from `admin-layout.tsx`.
- Add route-level error boundaries.
- Centralize permission-to-navigation mapping.
- Add automated tests for auth redirect and POS critical flows.
- Add deployment notes for ERPNext reverse proxy/session setup.

# ERP UI Design System

Date: 2026-04-21  
Scope: alpha-neqat React frontend for ERPNext.

## Goal

The interface must feel calm, precise, data-first, and trustworthy. It should help users complete ERP work quickly while reducing mistakes in forms, tables, and workflow actions.

## Core Rules

- Use structure before decoration.
- Use a minimal color system.
- Keep data readable at high density.
- Prefer consistency over novelty.
- One primary action per page.
- Every important ERP state must be visible.
- Server truth remains in ERPNext.

## Color Tokens

| Purpose | Token | Value |
| --- | --- | --- |
| Primary | `--primary` | `#2563EB` |
| Background | `--bg` | `#F8FAFC` |
| Surface | `--surface` | `#FFFFFF` |
| Border | `--line` | `#E5E7EB` |
| Text Primary | `--text` | `#111827` |
| Text Secondary | `--muted` | `#6B7280` |
| Success | `--green` | `#16A34A` |
| Warning | `--amber` | `#F59E0B` |
| Danger | `--red` | `#DC2626` |
| Info | `--info` | `#0EA5E9` |

## Typography

- Page title: 24px, bold.
- Section title: 18px, bold.
- Body text: 14px.
- Table text: about 13px.
- Avoid negative letter spacing.

## Layout

Standard ERP page structure:

```text
Sidebar | Header
        | Breadcrumbs
        | Page Header + Primary Action
        | Filters / Summary
        | Table / Form / Detail Content
```

## Sidebar

- Group by ERP modules.
- Show icons and labels.
- Support collapsed mode.
- Disabled future modules should be visibly unavailable.

## Tables

Tables must support:

- Filtering.
- Sorting.
- Pagination.
- Row actions.
- Hover states.
- Click-through to details.

Tables should remain calm: white surface, light borders, sticky header, and compact readable rows.

## Forms

Forms must be:

- Grouped by business meaning.
- Shorter where possible.
- Clear about ERPNext link fields.
- Clear about server-owned validation.
- Strong in focus, error, disabled, and loading states.

## Buttons

- Primary: blue.
- Secondary: neutral/gray.
- Danger: red.
- Use one primary action per page.

## Status Badges

Use semantic meaning:

- Green: success/active/paid.
- Blue: info/type/status context.
- Amber: warning/pending.
- Red: danger/disabled/cancelled.

## Implementation Notes

The current implementation uses native React components and CSS tokens instead of adding a large UI library. This keeps the first ERP module lean while preserving a clear migration path to a component library later if needed.


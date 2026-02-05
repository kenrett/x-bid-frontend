# AGENTS.md - x-bid-frontend

## Scope

This repository is the React + Vite frontend for X-Bid.

Primary responsibilities:

- User and admin UI flows
- Session/token handling in browser context
- Real-time auction UX (Action Cable)
- Accessibility and failure-state UX
- Deployment readiness for Vercel

## Deployment Target

- Frontend deploy platform: **Vercel**
- Backend/API deploy platform: **Render** (separate repo)
- Treat backend API contract compatibility as a hard requirement.

## Non-Negotiables

- Do not commit or expose secrets (`.env.local`, tokens, keys).
- Never trust frontend-only validation for security or money logic.
- Keep auth/session behavior aligned with backend contract.
- Surface actionable error states; avoid silent failures.
- Preserve accessibility for forms, modals, navigation, and async states.

## Required Workflow For Changes

1. Trace full vertical slice (route -> API client -> UI state -> feedback).
2. Update UI + tests together.
3. If API shape assumptions changed, sync with backend OpenAPI contract.
4. Run quality checks before handoff:
   - `npm run lint`
   - `npm run test:ci`
   - `npm run build`
5. If auth/payments/admin behavior changed, include explicit manual QA notes.

## Vercel Readiness Checklist

- Correct production env vars configured (`VITE_API_BASE_URL`, Stripe publishable key, etc.).
- No dev-only fallbacks enabled in production behavior.
- Client routes and rewrites in `vercel.json` still valid.
- Build output is deterministic and deployable.
- Error boundaries and maintenance-mode handling are intact.

## Backend Contract Guardrails (Render API)

- Keep endpoint paths, payload fields, and error shapes in sync with backend.
- Prefer tolerant parsing only where backend explicitly supports variants.
- Do not invent backend behavior in frontend code; document assumptions.
- Flag and coordinate any breaking API changes before merge.

## UX/A11y Guardrails

- Keyboard navigation works for interactive controls.
- Focus management is explicit for dialogs and error states.
- Inputs have labels and clear validation messaging.
- Loading/empty/error states are explicit for every async view.
- Avoid color-only status indicators where practical.

## PR Handoff Template

- What changed:
- User-facing impact:
- API contract impact:
- Vercel config/env impact:
- Accessibility impact:
- Manual verification performed:

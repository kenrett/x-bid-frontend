# Post-Deploy QA Checklist (BidderSweet)

## Auth & Roles

- [ ] Sign in as **user** → can browse auctions; cannot see any admin navigation/link entry points.
- [ ] Navigate directly to `/admin` and `/admin/payments` as **user** → redirected to `/login` (with `redirect=`) and/or “admin access only” messaging; cannot view admin shell.
- [ ] Sign in as **admin** → can access `/admin`, sees admin shell (“Admin Console”, “Control Center”), can access `/admin/payments`.
- [ ] Sign in as **superadmin** → can access `/admin/users` (and sees “Users” in admin nav); **admin** (non-super) sees “Access denied” on `/admin/users`.
- [ ] API auth behavior (curl/Postman):
  - [ ] Call any admin API with **no auth** → `401`
  - [ ] Call same admin API with **user auth** → `403`
  - [ ] Call same admin API with **admin auth** → `200`
  - [ ] Call superadmin-only admin API with **admin auth** → `403` (or whichever status backend uses)

## Money Loop (Bid Packs)

- [ ] Purchase a bid pack once → bid credits increase exactly once.
- [ ] Reload/refresh success page or replay the callback/webhook trigger path → credits do not increase again (idempotent).
- [ ] Receipt link rendering:
  - [ ] When receipt URL exists → link is visible and opens successfully.
  - [ ] When receipt URL missing → no link rendered (no empty/broken anchor).

## Payments / Ledger / Audit

- [ ] After purchase, verify a ledger entry exists and matches: user, amount, currency, pack, timestamp, and resulting balance.
- [ ] Admin payments reconciliation:
  - [ ] As admin, open Payments list and a payment detail page (renders details, ledger entries).
  - [ ] Use “repair credits” only when discrepancy is present; verify it resolves mismatch and is logged.
  - [ ] If refund is available: issue refund with a small amount and reason; verify status updates and audit/ledger reflects it.

## Negative / Abuse Cases

- [ ] Attempt to “apply purchase” / credit adjustment with a different user id than the authenticated user → rejected (status and error message as expected).
- [ ] Attempt purchase-related actions with expired/invalid token → `401` and session handling behaves correctly (forced logout / redirect to login).
- [ ] Try admin-only UI actions as non-admin by direct URL manipulation → blocked (no data leakage).

## “Best Practice Paths” Smoke

- [ ] Confirm key user flows still work:
  - [ ] Auction list loads.
  - [ ] Auction detail loads.
  - [ ] Bidding action (if allowed in env) behaves normally.
  - [ ] Logout clears session and returns to public browsing.

## Suggested Adds (Commonly Missed)

- [ ] Superadmin maintenance toggle: enable maintenance → app redirects to `/maintenance`; disable → app returns to auctions.
- [ ] WebSocket auth: with valid token → live updates connect; without/expired token → connection denied and app remains stable.
- [ ] Stripe failure path: cancel/failed payment → credits unchanged; user sees a clear error state.
- [ ] Cross-browser quick pass: at least one Chromium + one WebKit/Firefox.

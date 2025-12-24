# Session Lifecycle (Frontend Contract)

This app treats a “session” as the combination of `token`, `refresh_token`, `session.session_token_id`, and the normalized `user`.

## Creation

- On `/login` or `/signup`, the API returns `token`, `refresh_token`, `session` (`session_token_id`, `session_expires_at`, `seconds_remaining`), `user`, optional `is_admin`/`is_superuser`, and optional `redirect_path`.
- The AuthProvider normalizes the user, sets context state, and writes `token`, `refreshToken`, `sessionTokenId` (from `session.session_token_id`), and `user` JSON to `localStorage`.

## Persistence

- On load, AuthProvider hydrates from `localStorage` (user + tokens) and marks `isReady=true`.
- Axios client attaches `Authorization: Bearer <token>` if present.

## Refresh / Remaining Time

- Every 60s, AuthProvider calls `GET /session/remaining?session_token_id=...`.
- If `remaining_seconds` is returned and <= 0 → logout.
- If `token`/`refresh_token`/`session_token_id` are returned → replace stored values.
- If a `user` or role flags are returned → merge/normalize and persist.
- If `remaining_seconds` is absent → keep session but clear the countdown.

## Invalidations

- If `/session/remaining` returns 401 → logout.
- A WebSocket subscription to `SessionChannel` (authorized via `Authorization: Bearer <token>` header) listens for `session_invalidated` and logs out.
- Logout clears user, tokens, session id, countdown, and `localStorage` entries.

## Storage Keys

- `user` (JSON)
- `token`
- `refreshToken`
- `sessionTokenId`

## Notes

- `is_admin` and `is_superuser` may come from either the top-level response or inside `user`; we merge them and normalize.
- Session polling and cable subscription are no-ops if there’s no `token` or `session_token_id`.

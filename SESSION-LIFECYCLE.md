# Session Lifecycle (Frontend Contract)

This app treats a “session” as the combination of `token`, `refresh_token`, `session.session_token_id`, and the normalized `user`.

## Creation

- On `/login` or `/signup`, the API returns `token`, `refresh_token`, `session` (`session_token_id`, `session_expires_at`, `seconds_remaining`), `user`, optional `is_admin`/`is_superuser`, and optional `redirect_path`.
- The AuthProvider normalizes the user and sets context state. Tokens/session ids are kept in-memory only (not persisted).

## Persistence

- On load, AuthProvider treats the user as logged out and marks `isReady=true`.
- Axios client attaches `Authorization: Bearer <token>` only when an in-memory token is present.

## Refresh / Remaining Time

- Every 60s, AuthProvider calls `GET /api/v1/session/remaining?session_token_id=...`.
- If `remaining_seconds` is returned and <= 0 → logout.
- If `token`/`refresh_token`/`session_token_id` are returned → replace in-memory values.
- If a `user` or role flags are returned → merge/normalize in memory.
- If `remaining_seconds` is absent → keep session but clear the countdown.

## Invalidations

- If `/api/v1/session/remaining` returns 401 → logout.
- A WebSocket subscription to `SessionChannel` (token passed as `?token=...` for browser ActionCable; Node/WebSocket environments may also attach an `Authorization` header) listens for `session_invalidated` and logs out.
- Logout clears user, tokens, session id, and countdown (in-memory state).

## Storage Keys

- None. Auth artifacts are not stored in `localStorage`.

## Notes

- `is_admin` and `is_superuser` may come from either the top-level response or inside `user`; we merge them and normalize.
- Session polling and cable subscription are no-ops if there’s no `token` or `session_token_id`.

# Session Lifecycle (Frontend Contract)

This app treats a “session” as the combination of `access_token`, `refresh_token`, `session_token_id`, and the normalized `user`.

## Creation

- On `/login` or `/signup`, the API returns `access_token`, `refresh_token`, `session_token_id`, and `user` (Auth Contract v1).
- AuthProvider normalizes the user, persists the full session, and sets context state.

## Persistence

- On load, AuthProvider hydrates the session from storage and validates all required fields; invalid persisted auth is cleared and the user is redirected to `/login`.
- Axios client attaches `Authorization: Bearer <access_token>` only when a complete in-memory session exists.

## Refresh / Remaining Time

- Every 60s, AuthProvider calls `GET /api/v1/session/remaining?session_token_id=...`.
- If `remaining_seconds` is returned and <= 0 → logout.
- If `access_token`/`refresh_token`/`session_token_id` are returned → replace stored values.
- If a `user` or role flags are returned → merge/normalize in memory.
- If `remaining_seconds` is absent → keep session but clear the countdown.

## Invalidations

- If `/api/v1/session/remaining` returns 401 → logout.
- A WebSocket subscription to `SessionChannel` (token passed as `?token=...` for browser ActionCable; Node/WebSocket environments may also attach an `Authorization` header) listens for `session_invalidated` and logs out.
- Logout clears user, tokens, session id, and countdown (in-memory state).

## Storage Keys

- `localStorage["auth.session.v1"]`: JSON `{ access_token, refresh_token, session_token_id, user }`

## Notes

- `is_admin` and `is_superuser` may come from either the top-level response or inside `user`; we merge them and normalize.
- Session polling and cable subscription are no-ops if there’s no `token` or `session_token_id`.

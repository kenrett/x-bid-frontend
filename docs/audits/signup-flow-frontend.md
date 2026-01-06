# Signup Flow (Frontend Audit)

Goal: document the **actual signup request path** used by the frontend and the **response contract** the frontend expects / relies on.

## Where signup is called (URL + method)

- Signup page route: `src/router.tsx` → `"/signup"` renders `SignUpForm`.
- Signup API call site: `src/features/auth/components/SignUpForm/SignUpForm.tsx`
  - Method: `POST`
  - URL path: `"/api/v1/signup"`

There is **no RTK Query / createApi slice** for signup in this repo (signup uses the shared Axios client directly).

## Request body shape (fields + names)

`src/features/auth/components/SignUpForm/SignUpForm.tsx`

```ts
await client.post("/api/v1/signup", {
  name,
  email_address,
  password,
});
```

So the FE sends:

```json
{
  "name": "string",
  "email_address": "string",
  "password": "string"
}
```

## Response parsing & FE expectations

### Runtime parsing (what the component reads)

`src/features/auth/components/SignUpForm/SignUpForm.tsx`

The signup handler passes `response.data` through `normalizeAuthResponse(...)` and forwards the normalized payload into `useAuth().login(...)`:

- `token`
- `refresh_token`
- `session_token_id`
- `user`
- optional role flags (if present in the response at top-level or on `user`) are merged into the normalized `user`

### TypeScript types involved (copied)

The signup response itself is **not explicitly typed** at the callsite (`response.data` is treated as `any` from Axios).
The typed contract the FE _does_ enforce is what it passes into `login(...)`.

`src/features/auth/types/auth.ts`

```ts
export type LoginPayload = {
  token: string;
  refreshToken: string;
  sessionTokenId: string;
  user: User;
};
```

`src/features/auth/types/user.ts`

```ts
export interface User {
  bidCredits: number;
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  is_superuser?: boolean;
}
```

### Evidence from tests (expected post + login payload)

`src/features/auth/components/SignUpForm/SignUpForm.test.tsx`

- Confirms the FE calls `POST /api/v1/signup` with `{ name, email_address, password }`.
- Confirms the FE calls `login(...)` with a normalized `{ token, refreshToken, sessionTokenId, user }` payload.

## Expected JSON response (what the FE expects at runtime)

Based on `src/features/auth/components/SignUpForm/SignUpForm.tsx` + `src/features/auth/api/authResponse.ts`, the FE expects a JSON object like:

```json
{
  "token": "jwt-or-api-token",
  "refresh_token": "refresh-token",
  "session_token_id": "session-token-id",
  "user": {
    "id": 123,
    "name": "Player One",
    "email": "player@example.com",
    "bidCredits": 0,
    "is_admin": false,
    "is_superuser": false
  },
  "is_admin": false,
  "is_superuser": false
}
```

Notes:

- `is_admin` / `is_superuser` are treated as optional; they may arrive either at the top-level or within `user`.
- `normalizeAuthResponse(...)` merges role flags and normalizes key naming + user shape before calling `AuthProvider.login(...)`.

## Storage & hydration behavior (runtime assumptions)

### Where tokens and user are stored

`src/features/auth/providers/AuthProvider.tsx`

- Tokens/session identifiers are kept in-memory only (not persisted) to reduce XSS blast radius.
- On app boot, AuthProvider treats the user as logged out (unless a safe server-side refresh mechanism exists).
- On `login(...)`, AuthProvider sets the React context state and updates the in-memory token cache used by non-React modules (Axios, ActionCable).

### How auth is attached to API calls

`src/api/client.ts`

- Every Axios request reads the in-memory token and sets `Authorization: Bearer <token>` when present.
- Optional: when `VITE_AUTH_REFRESH_WITH_COOKIE === "true"`, the client will attempt `POST /api/v1/session/refresh` with `withCredentials: true` on `401` and retry the failed request.
- Otherwise, `401/403` triggers centralized logout via `app:unauthorized`.

### How session_token_id is used

`src/features/auth/providers/AuthProvider.tsx`

- AuthProvider polls `GET /api/v1/session/remaining` with `params: { session_token_id }`.
- AuthProvider also subscribes to `SessionChannel` via ActionCable with `{ token, session_token_id }`.

## Potential contract mismatch to verify

The frontend **calls** `POST /api/v1/signup` (`src/features/auth/components/SignUpForm/SignUpForm.tsx`), and the FE type layer models signup as the same auth-session response contract as login.

To keep signup/login aligned, `ApiJsonResponse<"/api/v1/signup","post">` is overridden to return the auth-session fields:
`access_token`, `refresh_token`, `session_token_id`, `user`, and optional `is_admin`/`is_superuser`.

### Notes on OpenAPI generation

- The generated OpenAPI types in `src/api/openapi-types.ts` may not include `/api/v1/signup` yet. The FE adds a local module-augmentation shim in `src/api/openapi-signup.d.ts` so `/api/v1/signup` is a valid `paths` key for `ApiJsonResponse`.
- When the backend OpenAPI spec exposes `/api/v1/signup`, regenerate with `OPENAPI_SPEC_PATH=../x-bid-backend/docs/api/openapi.json npm run gen:api-types` and the shim can be deleted.

## Common drift points (what must stay consistent)

### Key naming mismatch (snake_case vs camelCase)

- Backend responses (login/signup) are expected to return:
  - `refresh_token` (snake_case)
  - `session_token_id` (snake_case)
- Frontend `LoginPayload` expects:
  - `refreshToken` (camelCase)
  - `sessionTokenId` (camelCase)

This currently works because the frontend normalizes responses (snake_case or camelCase) into a consistent `LoginPayload` shape before calling `login(...)`:

- Normalizer: `src/features/auth/api/authResponse.ts`
- Used by login: `src/features/auth/components/LoginForm/LoginForm.tsx`
- Used by signup: `src/features/auth/components/SignUpForm/SignUpForm.tsx`

If the backend ever switches to camelCase (or mixes styles), the FE should still work as long as it continues to call the normalizer and the backend still returns all required fields.

### User email shape mismatch

The FE `User` type uses `email` (`src/features/auth/types/user.ts`), but the backend may send `email_address` / `emailAddress`.

The FE currently tolerates this via normalization:

- `normalizeUser(...)` accepts `email`, `email_address`, or `emailAddress` (`src/features/auth/api/user.ts`).

Signup should return `user` in the same shape as login does today (or at least within what `normalizeUser(...)` already tolerates), otherwise the header/account UI may show blank email.

### Role flags location (top-level vs nested user)

The FE accepts role flags in either place and normalizes them onto `user`:

- Response normalization merges top-level flags into `user` when needed (`src/features/auth/api/authResponse.ts`).
- `normalizeUser(...)` tolerates multiple variants (`is_admin`, `isAdmin`, role/roles arrays, etc.) (`src/features/auth/api/user.ts`).

Recommendation for backend consistency: put role flags on `user` (`user.is_admin`, `user.is_superuser`) and optionally mirror them at the top-level for convenience; the FE already handles both.

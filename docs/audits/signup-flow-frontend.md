# Signup Flow (Frontend Audit)

Goal: document the **actual signup request path** used by the frontend and the **response contract** the frontend expects / relies on.

## Where signup is called (URL + method)

- Signup page route: `src/router.tsx:52` → `"/signup"` renders `SignUpForm`.
- Signup API call site: `src/features/auth/components/SignUpForm/SignUpForm.tsx:29`
  - Method: `POST`
  - URL path: `"/api/v1/signup"`

There is **no RTK Query / createApi slice** for signup in this repo (signup uses the shared Axios client directly).

## Request body shape (fields + names)

`src/features/auth/components/SignUpForm/SignUpForm.tsx:29-33`

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

`src/features/auth/components/SignUpForm/SignUpForm.tsx:34-49`

The signup handler destructures these fields from `response.data` and forwards them into `useAuth().login(...)`:

- `token`
- `refresh_token`
- `session_token_id`
- `user`
- `is_admin`
- `is_superuser`

### TypeScript types involved (copied)

The signup response itself is **not explicitly typed** at the callsite (`response.data` is treated as `any` from Axios).
The typed contract the FE _does_ enforce is what it passes into `login(...)`.

`src/features/auth/types/auth.ts:3-10`

```ts
export type LoginPayload = {
  token: string;
  refreshToken: string;
  sessionTokenId: string;
  user: User;
  is_admin?: boolean;
  is_superuser?: boolean;
};
```

`src/features/auth/types/user.ts:1-8`

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

`src/features/auth/components/SignUpForm/SignUpForm.test.tsx:111-123`

- Confirms the FE calls `POST /api/v1/signup` with `{ name, email_address, password }`.
- Confirms the FE calls `login(...)` with `{ token, refreshToken, sessionTokenId, user }` (and the component also passes `is_admin`/`is_superuser` when present).

## Expected JSON response (what the FE expects at runtime)

Based on `src/features/auth/components/SignUpForm/SignUpForm.tsx:34-49`, the FE expects a JSON object like:

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

- `is_admin` / `is_superuser` are treated as optional (the signup test does not include them).
- The `User` object is later normalized/merged with role flags in `AuthProvider.login(...)` (`src/features/auth/providers/AuthProvider.tsx:82-108`).

## Storage & hydration behavior (runtime assumptions)

### Where tokens and user are stored

`src/features/auth/providers/AuthProvider.tsx:52-71` + `src/features/auth/providers/AuthProvider.tsx:82-108`

- On app boot, AuthProvider reads from `localStorage`:
  - `token`
  - `refreshToken`
  - `sessionTokenId`
  - `user` (JSON)
- On `login(...)`, AuthProvider persists:
  - `localStorage["user"] = JSON.stringify(normalizedUser)`
  - `localStorage["token"] = jwt`
  - `localStorage["refreshToken"] = refresh`
  - `localStorage["sessionTokenId"] = sessionId`

### How auth is attached to API calls

`src/api/client.ts:56-65`

- Every Axios request reads `localStorage["token"]` and sets `Authorization: Bearer <token>` when present.

### How session_token_id is used

`src/features/auth/providers/AuthProvider.tsx:261-273` + `src/features/auth/providers/AuthProvider.tsx:314-332`

- AuthProvider polls `GET /api/v1/session/remaining` with `params: { session_token_id }`.
- AuthProvider also subscribes to `SessionChannel` via ActionCable with `{ token, session_token_id }`.

## Potential contract mismatch to verify

The frontend **calls** `POST /api/v1/signup` (`src/features/auth/components/SignUpForm/SignUpForm.tsx:29`), but the OpenAPI overrides in this repo define a signup-like response under `POST /api/v1/users`:

`src/api/openapi-helpers.ts:125-134` (response fields include `token`, `refresh_token`, `session_token_id`, `user`, `is_admin?`, `is_superuser?`).

If the backend only exposes `POST /api/v1/users` (and not `/api/v1/signup`), signup will fail at runtime despite the FE expectations.

## Common drift points (what must stay consistent)

### Key naming mismatch (snake_case vs camelCase)

- Backend responses (login/signup) are expected to return:
  - `refresh_token` (snake_case)
  - `session_token_id` (snake_case)
- Frontend `LoginPayload` expects:
  - `refreshToken` (camelCase)
  - `sessionTokenId` (camelCase)

This currently works because the frontend normalizes responses (snake_case or camelCase) into a consistent `LoginPayload` shape before calling `login(...)`:

- Normalizer: `src/features/auth/api/authResponse.ts:1`
- Used by login: `src/features/auth/components/LoginForm/LoginForm.tsx:1`
- Used by signup: `src/features/auth/components/SignUpForm/SignUpForm.tsx:1`

If the backend ever switches to camelCase (or mixes styles), the FE should still work as long as it continues to call the normalizer and the backend still returns all required fields.

### User email shape mismatch

The FE `User` type uses `email` (`src/features/auth/types/user.ts:1-8`), but the backend may send `email_address` / `emailAddress`.

The FE currently tolerates this via normalization:

- `normalizeUser(...)` accepts `email`, `email_address`, or `emailAddress` (`src/features/auth/api/user.ts:21-25`).

Signup should return `user` in the same shape as login does today (or at least within what `normalizeUser(...)` already tolerates), otherwise the header/account UI may show blank email.

### Role flags location (top-level vs nested user)

The FE accepts role flags in either place and normalizes them onto `user`:

- Response normalization merges top-level flags into `user` when needed (`src/features/auth/api/authResponse.ts:1`).
- `normalizeUser(...)` tolerates multiple variants (`is_admin`, `isAdmin`, role/roles arrays, etc.) (`src/features/auth/api/user.ts:26-63`).

Recommendation for backend consistency: put role flags on `user` (`user.is_admin`, `user.is_superuser`) and optionally mirror them at the top-level for convenience; the FE already handles both.

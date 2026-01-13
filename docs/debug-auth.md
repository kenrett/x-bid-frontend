# Auth Debug Runbook

This runbook explains how to capture evidence for:

- Localhost storefront switch invalid_token
- Production login 502/CORS

## Enable Debug Mode

Set the flag before starting Vite:

```bash
VITE_DEBUG_AUTH=1 npm run dev
```

You should see a bottom-left **Auth Debug** panel plus extra console logs tagged with:

- `[api debug]`
- `[cable debug]`
- `[auth debug]`

## Localhost: storefront switch invalid_token

1. Start the app with `VITE_DEBUG_AUTH=1`.
2. Navigate to a purchase or any flow that links to another storefront (e.g. a blocked purchase that says “Open it there.”).
3. Click the storefront link to open the other storefront.
4. On the new storefront, watch:
   - Console: `storefront switch: before` and `storefront switch: after`
   - Console: `storefront switch whoami`
   - Debug panel: origin, storefront, API base, auth header/cookie status

### What to capture

- Console logs for the switch events and whoami.
- Debug panel screenshot showing:
  - `origin`
  - `storefront`
  - `api base`
  - `localStorage auth keys`
  - `document.cookie length`
  - last 5 API requests and WS attempts

## Production login 502/CORS

1. Open the login page in production (or prod-like env).
2. Submit the login form.
3. Capture console logs:
   - `[auth debug] login submit`
   - `[api debug] login request headers`
   - `[api debug] response` or `[api debug] response error`
4. Capture the debug panel state after the login attempt.

### What to check

- Whether the login request includes `withCredentials: true`.
- Whether the request headers include any `X-*` headers (preflight indicator).
- Whether response headers contain:
  - `access-control-allow-origin`
  - `access-control-allow-credentials`
  - `vary`
  - `set-cookie`

## Sample Output Format

```text
[auth debug] login submit { method: "POST", url: "https://api.example.com/api/v1/login", withCredentials: true, headers: ["Content-Type"], note: "X-Storefront-Key may be added by interceptor" }
[api debug] login request headers { header_keys: ["Content-Type", "X-Storefront-Key"], has_extra_headers: true, extra_headers: ["X-Storefront-Key"], withCredentials: true }
[api debug] response error { status: 502, message: "Network Error", code: "ERR_NETWORK", cors: { "access-control-allow-origin": undefined, "access-control-allow-credentials": undefined, vary: undefined, "set-cookie": undefined } }
```

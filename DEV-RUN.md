# Running Backend and Frontend Together

Below are lightweight steps to boot both services in development. Adjust paths and ports as needed.

## Prereqs

- Backend repo checked out locally (examples assume it lives next to this frontend: `../x-bid-backend`).
- Node.js 18+ and npm installed for the frontend.
- Backend dependencies already installed (bundle/npm/whatever your backend uses).

## Two-terminal approach

1. **Backend**

   ```bash
   cd ../x-bid-backend
   bin/dev
   ```

   (Use your normal backend entrypoint, e.g. `rails s`, `bin/dev`, `npm run dev`, etc.)

2. **Frontend**  
   From this repo:

   ```bash
   npm install
   VITE_API_URL=http://localhost:3000 npm run dev -- --host --port 4173
   ```

   - Point `VITE_API_URL` to wherever the backend is listening.
   - Visit http://localhost:4173.

## One-liner helper (optional)

If you prefer a single command (and you have `bash`), create a script in your own shell profile:

```bash
cat > ~/bin/run-xbid-dev <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="${BACKEND_DIR:-../x-bid-backend}"
FRONTEND_DIR="${FRONTEND_DIR:-$(pwd)}"

pushd "$BACKEND_DIR" >/dev/null
echo "[backend] starting..."
bin/dev &
BACK_PID=$!
popd >/dev/null

pushd "$FRONTEND_DIR" >/dev/null
echo "[frontend] starting..."
VITE_API_URL="${VITE_API_URL:-http://localhost:3000}" npm run dev -- --host --port 4173
popd >/dev/null

trap "kill $BACK_PID >/dev/null 2>&1 || true" EXIT
EOF
chmod +x ~/bin/run-xbid-dev
```

Then run `run-xbid-dev` from this repo. It assumes the backend is in `../x-bid-backend`; override with `BACKEND_DIR=/path/to/backend`.

## Environment notes

- `VITE_API_URL` must point to the backend base URL.
- If you use websockets, also set `VITE_CABLE_URL` to the ActionCable/websocket endpoint.
- Stripe checkout uses `VITE_STRIPE_PUBLISHABLE_KEY`; set a test key in `.env.development`.
- Playwright e2e runs set `VITE_E2E_TESTS=true` to enable test-only hooks (e.g., Stripe loader overrides); you don’t need this for normal development.

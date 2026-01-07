# CI pipeline

- **Pull requests:** run `Frontend Tests` (npm ci → OpenAPI contract drift check → optional typecheck/lint/test → build). If a Rails backend is present, `Backend Tests` run with Ruby 3.4, PostgreSQL, `rails db:prepare`, and `rails test`. Vercel preview deploys happen via the Vercel integration when enabled.
- **Main branch:** same checks as PRs; on merge, Vercel deploys the frontend and Render deploys the backend via their native integrations.

## Backend OpenAPI contract enforcement

The frontend does not check in the backend OpenAPI spec. CI must supply the backend `openapi.json` (artifact) and set:

- `OPENAPI_SPEC_PATH=/path/to/openapi.json` (preferred) or `OPENAPI_URL=https://…/openapi.json`

In this repo’s GitHub Actions workflow, pull requests download the backend artifact (`openapi-json`) and export `OPENAPI_SPEC_PATH` automatically. For non-PR runs (pushes to `main`), you must set `OPENAPI_URL` (URL, recommended) or `OPENAPI_SPEC_PATH` (file path) as GitHub repository variables (`Settings → Secrets and variables → Actions → Variables`) or the job will fail.

Then run:

- `npm run check:api-types` (ensures `src/api/openapi-types.ts` matches the backend spec)
- `npm run ct-2` (runs `src/contracts/openapiContract.test.ts` against the backend spec)

## Deploy gating

- Require the GitHub checks `Frontend Tests` on `main` via branch protection. This blocks merges when CI fails, so Vercel/Render only deploy after green builds.
- No secrets are stored in workflows; deployments are handled by the configured Vercel/Render connections.

## Test environment variables

- **Frontend:** none are required for unit tests; build pulls from the checked-in config. Add any needed `VITE_…` vars as repository secrets if new integrations demand them.

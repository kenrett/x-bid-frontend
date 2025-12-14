# CI pipeline

- **Pull requests:** run `Frontend Tests` (npm ci → optional typecheck/lint/test → build). If a Rails backend is present, `Backend Tests` run with Ruby 3.4, PostgreSQL, `rails db:prepare`, and `rails test`. Vercel preview deploys happen via the Vercel integration when enabled.
- **Main branch:** same checks as PRs; on merge, Vercel deploys the frontend and Render deploys the backend via their native integrations.

## Deploy gating

- Require the GitHub checks `Frontend Tests` on `main` via branch protection. This blocks merges when CI fails, so Vercel/Render only deploy after green builds.
- No secrets are stored in workflows; deployments are handled by the configured Vercel/Render connections.

## Test environment variables

- **Frontend:** none are required for unit tests; build pulls from the checked-in config. Add any needed `VITE_…` vars as repository secrets if new integrations demand them.

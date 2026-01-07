# OpenAPI contract workflow

This repo does **not** check in a copy of the backend OpenAPI spec. Instead, the frontend:

- Generates `src/api/openapi-types.ts` from a backend-provided `openapi.json`.
- Runs contract drift tests against that same backend-provided spec.

## Local development

You must provide the backend OpenAPI spec via one of:

- `OPENAPI_SPEC_PATH=/path/to/openapi.json` (preferred)
- `OPENAPI_URL=https://…/openapi.json` (URL source)

Then run:

- Generate types:
  - `OPENAPI_SPEC_PATH=../x-bid-backend/docs/api/openapi.json npm run gen:api-types`
- Verify types are up to date:
  - `OPENAPI_SPEC_PATH=../x-bid-backend/docs/api/openapi.json npm run check:api-types`
- Run the contract drift test:
  - `OPENAPI_SPEC_PATH=../x-bid-backend/docs/api/openapi.json npm run ct-2`

## CI

CI must provide the backend spec (for example by downloading the backend build artifact) and set:

- `OPENAPI_SPEC_PATH=/path/to/openapi.json` (preferred) or `OPENAPI_URL=https://…/openapi.json`

Missing OpenAPI source must be treated as a failure (contract drift must not be skipped).

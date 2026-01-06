# OpenAPI contract workflow

This repo does **not** check in a copy of the backend OpenAPI spec. Instead, the frontend:

- Generates `src/api/openapi-types.ts` from a backend-provided `openapi.json`.
- Runs contract drift tests against that same backend-provided spec.

## Local development

1. Ensure the backend repo is available (default expected location):
   - `../x-bid-backend/docs/api/openapi.json`

2. Set `OPENAPI_SPEC_PATH` to the backend spec and run:
   - Generate types:
     - `OPENAPI_SPEC_PATH=../x-bid-backend/docs/api/openapi.json npm run gen:api-types`
   - Verify types are up to date:
     - `OPENAPI_SPEC_PATH=../x-bid-backend/docs/api/openapi.json npm run check:api-types`
   - Run the contract drift test:
     - `OPENAPI_SPEC_PATH=../x-bid-backend/docs/api/openapi.json npm run ct-2`

If `OPENAPI_SPEC_PATH` is not set and the default backend path is not present, contract drift tests are skipped locally.

## CI

CI must provide the backend spec (for example by downloading the backend build artifact) and set:

- `OPENAPI_SPEC_PATH=/path/to/openapi.json`

In CI, missing `OPENAPI_SPEC_PATH` should be treated as a failure (contract drift must not be skipped).

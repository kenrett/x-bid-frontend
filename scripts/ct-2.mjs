import { execFileSync } from "node:child_process";
import process from "node:process";

const specPath = process.env.OPENAPI_SPEC_PATH?.trim();
const specUrl = process.env.OPENAPI_URL?.trim();
if (!specPath && !specUrl) {
  console.error(
    "Missing OpenAPI source. Set OPENAPI_SPEC_PATH=/path/to/openapi.json (preferred) or OPENAPI_URL=https://…/openapi.json.",
  );
  process.exit(1);
}

execFileSync(
  "npx",
  ["vitest", "run", "src/contracts/openapiContract.test.ts"],
  {
    stdio: "inherit",
    env: { ...process.env, OPENAPI_SPEC_PATH: specPath, OPENAPI_URL: specUrl },
  },
);

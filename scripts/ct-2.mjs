import { execFileSync } from "node:child_process";
import process from "node:process";

const specPath = process.env.OPENAPI_SPEC_PATH?.trim();
if (!specPath) {
  console.error("Missing `OPENAPI_SPEC_PATH` env var.");
  process.exit(1);
}

execFileSync(
  "npx",
  ["vitest", "run", "src/contracts/openapiContract.test.ts"],
  {
    stdio: "inherit",
    env: { ...process.env, OPENAPI_SPEC_PATH: specPath },
  },
);

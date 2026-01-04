import { execFileSync } from "node:child_process";
import process from "node:process";

const specPath = process.env.BACKEND_OPENAPI_PATH?.trim();
if (!specPath) {
  console.error("Missing `BACKEND_OPENAPI_PATH` env var.");
  process.exit(1);
}

execFileSync(
  "npx",
  ["vitest", "run", "src/contracts/openapiContract.test.ts"],
  {
    stdio: "inherit",
    env: { ...process.env, BACKEND_OPENAPI_PATH: specPath },
  },
);


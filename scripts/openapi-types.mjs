import { execFileSync } from "node:child_process";
import process from "node:process";

const specPath = process.env.BACKEND_OPENAPI_PATH?.trim();
if (!specPath) {
  console.error("Missing `BACKEND_OPENAPI_PATH` env var.");
  process.exit(1);
}

execFileSync(
  "node",
  [
    "scripts/gen-api-types.mjs",
    "--spec",
    specPath,
    "--out",
    "src/api/openapi-types.ts",
  ],
  { stdio: "inherit" },
);


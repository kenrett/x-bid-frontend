import { execFileSync } from "node:child_process";
import process from "node:process";

const run = (cmd, args, options = {}) =>
  execFileSync(cmd, args, { stdio: "inherit", ...options });

const runCapture = (cmd, args) =>
  execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
    .toString()
    .trim();

const defaultSpecPath = "../x-bid-backend/docs/api/openapi.json";
const specPath = process.env.OPENAPI_SPEC_PATH?.trim() || defaultSpecPath;
if (process.env.CI && !process.env.OPENAPI_SPEC_PATH?.trim()) {
  console.error("Missing `OPENAPI_SPEC_PATH` env var in CI.");
  process.exit(1);
}

const main = () => {
  run("node", [
    "scripts/gen-api-types.mjs",
    "--spec",
    specPath,
    "--out",
    "src/api/openapi-types.ts",
  ]);

  const changed = runCapture("git", [
    "--no-pager",
    "diff",
    "--name-only",
    "--",
    "src/api/openapi-types.ts",
  ]);
  if (!changed) return;

  console.error("\nGenerated OpenAPI types differ from the committed file:\n");
  run("git", ["--no-pager", "diff", "--stat", "--", "src/api/openapi-types.ts"]);
  console.error("\nFirst 200 lines of diff:\n");
  run("sh", [
    "-lc",
    "git --no-pager diff -- src/api/openapi-types.ts | head -n 200",
  ]);

  throw new Error("openapi-types out of date");
};

try {
  main();
} catch {
  console.error(
    "\nOpenAPI types are out of date. Run `OPENAPI_SPEC_PATH=../x-bid-backend/docs/api/openapi.json npm run gen:api-types` and commit the result.",
  );
  process.exit(1);
}

import { execFileSync } from "node:child_process";
import process from "node:process";

const run = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit" });

const main = () => {
  run("node", [
    "scripts/gen-api-types.mjs",
    "--spec",
    "src/contracts/openapi.json",
    "--out",
    "src/api/openapi-types.ts",
  ]);

  run("git", ["diff", "--exit-code", "--", "src/api/openapi-types.ts"]);
};

try {
  main();
} catch {
  console.error(
    "\nOpenAPI types are out of date. Run `npm run gen:api-types` and commit the result.",
  );
  process.exit(1);
}

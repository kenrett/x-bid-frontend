import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import os from "node:os";
import openapiTS from "openapi-typescript";
import ts from "typescript";
import prettier from "prettier";

const DEFAULT_OUT_FILE = "src/api/openapi-types.ts";

const isUrl = (value) => /^https?:\/\//i.test(value);

const parseArgs = (argv) => {
  const args = { out: DEFAULT_OUT_FILE, snapshot: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out") {
      args.out = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--snapshot") {
      args.snapshot = argv[i + 1];
      i += 1;
      continue;
    }
  }
  return args;
};

const readJsonFile = async (filePath) => {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
};

const readJsonUrl = async (url) => {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI schema (${response.status}) ${url}`);
  }
  return response.json();
};

const ensureDir = async (filePath) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
};

const cloneJson = (value) => {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const sanitizeOpenApiSchema = (schema) => {
  const components = schema?.components;
  const schemas = components?.schemas;
  if (!schemas || typeof schemas !== "object") return schema;

  const placeholderSchema = (note) => ({
    type: "object",
    description: `Invalid schema placeholder from source: ${note}`,
    additionalProperties: true,
  });

  const fixNode = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const entry of node) fixNode(entry);
      return;
    }

    if (node.properties && typeof node.properties === "object") {
      for (const [propKey, propValue] of Object.entries(node.properties)) {
        if (typeof propValue === "string") {
          node.properties[propKey] = { type: propValue };
          continue;
        }
        fixNode(propValue);
      }
    }

    if (typeof node.items === "string") {
      node.items = placeholderSchema(node.items);
    } else {
      fixNode(node.items);
    }

    if (typeof node.additionalProperties === "string") {
      node.additionalProperties = placeholderSchema(node.additionalProperties);
    } else {
      fixNode(node.additionalProperties);
    }

    for (const [key, value] of Object.entries(node)) {
      if (key === "properties" || key === "items" || key === "additionalProperties")
        continue;
      fixNode(value);
    }
  };

  for (const [key, value] of Object.entries(schemas)) {
    if (typeof value !== "string") continue;
    schemas[key] = placeholderSchema(value);
  }

  for (const value of Object.values(schemas)) fixNode(value);

  return schema;
};

const main = async () => {
  const { out, snapshot } = parseArgs(process.argv.slice(2));
  const specPath = process.env.OPENAPI_SPEC_PATH?.trim();
  const specUrl = process.env.OPENAPI_URL?.trim();

  if (specPath && isUrl(specPath)) {
    throw new Error(
      "OPENAPI_SPEC_PATH looks like a URL. Set OPENAPI_URL for URLs, or provide a local file path in OPENAPI_SPEC_PATH.",
    );
  }

  if (specPath && specUrl) {
    throw new Error(
      "Both OPENAPI_SPEC_PATH and OPENAPI_URL are set. Set only one to avoid ambiguity.",
    );
  }

  if (!specPath && !specUrl) {
    throw new Error(
      "Missing OpenAPI source. Set OPENAPI_SPEC_PATH=/path/to/openapi.json (preferred) or OPENAPI_URL=https://…/openapi.json.",
    );
  }

  const rawSchema = specUrl
    ? await (async () => {
        // Fetch then write the raw JSON to a temp file for easier debugging/repro.
        const tmpDirPrefix = path.join(os.tmpdir(), "x-bid-openapi-");
        const dir = await fs.mkdtemp(tmpDirPrefix);
        const tmpFile = path.join(dir, "openapi.json");
        const json = await readJsonUrl(specUrl);
        await fs.writeFile(tmpFile, `${JSON.stringify(json, null, 2)}\n`, "utf8");
        return json;
      })()
    : await readJsonFile(specPath);

  if (snapshot) {
    await ensureDir(snapshot);
    const snapshotRaw = `${JSON.stringify(rawSchema, null, 2)}\n`;
    const formattedSnapshot = await (async () => {
      try {
        const config = (await prettier.resolveConfig(process.cwd())) ?? {};
        return await prettier.format(snapshotRaw, {
          ...config,
          filepath: snapshot,
        });
      } catch {
        return snapshotRaw;
      }
    })();
    await fs.writeFile(snapshot, formattedSnapshot, "utf8");
  }

  const schemaForTypes = sanitizeOpenApiSchema(cloneJson(rawSchema));
  const types = await openapiTS(schemaForTypes);
  const output =
    typeof types === "string"
      ? types
      : (() => {
          const source = ts.createSourceFile(
            path.basename(out),
            "",
            ts.ScriptTarget.Latest,
            false,
            ts.ScriptKind.TS,
          );
          const printer = ts.createPrinter({
            newLine: ts.NewLineKind.LineFeed,
          });
          return printer.printList(
            ts.ListFormat.MultiLine,
            ts.factory.createNodeArray(types),
            source,
          );
        })();

  const formatted = await (async () => {
    try {
      const config = (await prettier.resolveConfig(process.cwd())) ?? {};
      return await prettier.format(output, { ...config, filepath: out });
    } catch {
      return output;
    }
  })();
  await ensureDir(out);
  await fs.writeFile(out, formatted, "utf8");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

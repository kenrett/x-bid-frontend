// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

type JsonObject = Record<string, unknown>;

const isUrl = (value: string): boolean => /^https?:\/\//i.test(value);

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
    "Missing OpenAPI source. Set OPENAPI_SPEC_PATH=/path/to/openapi.json (preferred) or OPENAPI_URL=https://…/openapi.json.\n\nExample:\n  OPENAPI_SPEC_PATH=../x-bid-backend/docs/api/openapi.json npm run ct-2",
  );
}

const readOpenApi = async (): Promise<JsonObject> => {
  if (specUrl) {
    const response = await fetch(specUrl, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch OpenAPI schema (${response.status}) ${specUrl}`,
      );
    }
    return (await response.json()) as JsonObject;
  }

  const resolved = path.resolve(process.cwd(), specPath as string);
  if (!fs.existsSync(resolved)) {
    throw new Error(
      `OpenAPI spec not found at OPENAPI_SPEC_PATH: ${resolved}\n\nExample:\n  OPENAPI_SPEC_PATH=../x-bid-backend/docs/api/openapi.json npm run ct-2`,
    );
  }
  return JSON.parse(fs.readFileSync(resolved, "utf8")) as JsonObject;
};

const resolvePointer = (root: unknown, pointer: string): unknown => {
  if (!pointer.startsWith("#/")) return undefined;
  const parts = pointer.slice(2).split("/");
  let current: unknown = root;
  for (const raw of parts) {
    const key = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (!current || typeof current !== "object") return undefined;
    current = (current as JsonObject)[key];
  }
  return current;
};

const deref = (root: unknown, node: unknown, depth = 0): unknown => {
  if (!node || typeof node !== "object") return node;
  if (depth > 25) return node;
  if (Array.isArray(node))
    return node.map((entry) => deref(root, entry, depth));
  const record = node as JsonObject;
  if (typeof record.$ref === "string") {
    const resolved = resolvePointer(root, record.$ref);
    return deref(root, resolved, depth + 1);
  }
  return node;
};

const collectPropertyPaths = (
  root: unknown,
  schema: unknown,
  prefix = "",
  out = new Set<string>(),
  depth = 0,
): Set<string> => {
  if (depth > 20) return out;
  const resolved = deref(root, schema);
  if (!resolved || typeof resolved !== "object") return out;

  if (Array.isArray(resolved)) {
    for (const entry of resolved)
      collectPropertyPaths(root, entry, prefix, out, depth + 1);
    return out;
  }

  const record = resolved as JsonObject;

  const compositions = ["oneOf", "anyOf", "allOf"];
  for (const key of compositions) {
    const nodes = record[key];
    if (Array.isArray(nodes)) {
      for (const entry of nodes)
        collectPropertyPaths(root, entry, prefix, out, depth + 1);
    }
  }

  const properties = record.properties;
  if (
    properties &&
    typeof properties === "object" &&
    !Array.isArray(properties)
  ) {
    for (const [prop, propSchema] of Object.entries(properties as JsonObject)) {
      const nextPrefix = prefix ? `${prefix}.${prop}` : prop;
      out.add(nextPrefix);
      collectPropertyPaths(root, propSchema, nextPrefix, out, depth + 1);
    }
  }

  const items = record.items;
  if (items) collectPropertyPaths(root, items, prefix, out, depth + 1);

  return out;
};

const getOperation = (
  openapi: JsonObject,
  apiPath: string,
  method: "get" | "post" | "put" | "patch" | "delete",
): JsonObject => {
  const pathItem = openapi.paths as JsonObject | undefined;
  if (!pathItem || typeof pathItem !== "object")
    throw new Error("openapi.paths missing");
  const entry = pathItem[apiPath] as JsonObject | undefined;
  if (!entry) throw new Error(`OpenAPI missing path: ${apiPath}`);
  const operation = entry[method] as JsonObject | undefined;
  if (!operation)
    throw new Error(`OpenAPI missing operation: ${method} ${apiPath}`);
  return operation;
};

const getRequestSchema = (
  openapi: JsonObject,
  apiPath: string,
  method: "post" | "put" | "patch",
): unknown => {
  const operation = getOperation(openapi, apiPath, method);
  const requestBody = deref(openapi, operation.requestBody) as
    | JsonObject
    | undefined;
  const content = requestBody?.content as JsonObject | undefined;
  const appJson = content?.["application/json"] as JsonObject | undefined;
  return deref(openapi, appJson?.schema);
};

const getResponseSchema = (
  openapi: JsonObject,
  apiPath: string,
  method: "get" | "post" | "put" | "patch" | "delete",
  status: string,
): unknown => {
  const operation = getOperation(openapi, apiPath, method);
  const responses = operation.responses as JsonObject | undefined;
  const response = deref(openapi, responses?.[status]) as
    | JsonObject
    | undefined;
  const content = response?.content as JsonObject | undefined;
  const appJson = content?.["application/json"] as JsonObject | undefined;
  return deref(openapi, appJson?.schema);
};

const collectApiPathLiterals = (source: string): Set<string> => {
  const out = new Set<string>();
  const matches = source.matchAll(/["'`](\/api\/v1\/[^"'`\s]+)["'`]/g);
  for (const match of matches) {
    const value = match[1];
    if (!value.includes("${")) out.add(value);
  }
  return out;
};

describe("OpenAPI contract drift", () => {
  let openapiSchema: JsonObject;

  beforeAll(async () => {
    openapiSchema = await readOpenApi();
  });

  it("covers required FE endpoints", () => {
    const requiredPaths = [
      "/api/v1/signup",
      "/api/v1/login",
      "/api/v1/account/2fa/setup",
      "/api/v1/account/2fa/verify",
      "/api/v1/account/2fa/disable",
      "/api/v1/session/refresh",
      "/api/v1/checkouts",
      "/api/v1/checkout/success",
      "/api/v1/auctions/{auction_id}/bids",
    ];

    const paths = openapiSchema.paths as JsonObject | undefined;
    expect(paths).toBeTruthy();

    for (const apiPath of requiredPaths) {
      expect(paths).toHaveProperty(apiPath);
    }
  });

  it("auth request payloads include canonical field names and 2FA fields", () => {
    const loginSchema = getRequestSchema(
      openapiSchema,
      "/api/v1/login",
      "post",
    );
    const signupSchema = getRequestSchema(
      openapiSchema,
      "/api/v1/signup",
      "post",
    );
    const refreshSchema = getRequestSchema(
      openapiSchema,
      "/api/v1/session/refresh",
      "post",
    );

    const loginFields = collectPropertyPaths(openapiSchema, loginSchema);
    expect(
      loginFields.has("email_address") ||
        loginFields.has("emailAddress") ||
        loginFields.has("session.email_address"),
    ).toBe(true);
    expect(
      loginFields.has("password") || loginFields.has("session.password"),
    ).toBe(true);
    expect(loginFields.has("otp") || loginFields.has("session.otp")).toBe(true);
    expect(
      loginFields.has("recovery_code") ||
        loginFields.has("recoveryCode") ||
        loginFields.has("session.recovery_code") ||
        loginFields.has("session.recoveryCode"),
    ).toBe(true);

    const signupFields = collectPropertyPaths(openapiSchema, signupSchema);
    expect(
      signupFields.has("email_address") ||
        signupFields.has("user.email_address"),
    ).toBe(true);
    expect(
      signupFields.has("password") || signupFields.has("user.password"),
    ).toBe(true);
    expect(signupFields.has("name") || signupFields.has("user.name")).toBe(
      true,
    );

    const refreshFields = collectPropertyPaths(openapiSchema, refreshSchema);
    expect(
      refreshFields.has("refresh_token") ||
        refreshFields.has("session.refresh_token") ||
        refreshFields.has("refresh.refresh_token"),
    ).toBe(true);
  });

  it("login 401 uses canonical error envelope shape for 2FA-required flow", () => {
    const login401 = getResponseSchema(
      openapiSchema,
      "/api/v1/login",
      "post",
      "401",
    );
    const login401Fields = collectPropertyPaths(openapiSchema, login401);
    expect(login401Fields.has("error_code")).toBe(true);
    expect(login401Fields.has("message")).toBe(true);
  });

  it("2FA endpoints expose canonical methods and response schemas", () => {
    getOperation(openapiSchema, "/api/v1/account/2fa/setup", "post");
    getOperation(openapiSchema, "/api/v1/account/2fa/verify", "post");
    getOperation(openapiSchema, "/api/v1/account/2fa/disable", "post");

    const setup200 = getResponseSchema(
      openapiSchema,
      "/api/v1/account/2fa/setup",
      "post",
      "200",
    );
    const verify200 = getResponseSchema(
      openapiSchema,
      "/api/v1/account/2fa/verify",
      "post",
      "200",
    );
    const disable200 = getResponseSchema(
      openapiSchema,
      "/api/v1/account/2fa/disable",
      "post",
      "200",
    );

    const setupFields = collectPropertyPaths(openapiSchema, setup200);
    expect(setupFields.has("secret")).toBe(true);
    expect(setupFields.has("otpauth_uri")).toBe(true);

    const verifyFields = collectPropertyPaths(openapiSchema, verify200);
    expect(verifyFields.has("status")).toBe(true);
    expect(verifyFields.has("recovery_codes")).toBe(true);

    const disableFields = collectPropertyPaths(openapiSchema, disable200);
    expect(disableFields.has("status")).toBe(true);
  });

  it("FE auth/2FA endpoint literals must exist in backend OpenAPI paths", () => {
    const files = [
      "src/features/auth/components/LoginForm/LoginForm.tsx",
      "src/features/account/api/twoFactorApi.ts",
    ];
    const paths = openapiSchema.paths as JsonObject | undefined;
    expect(paths).toBeTruthy();

    const referencedPaths = new Set<string>();
    for (const file of files) {
      const source = fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
      const literals = collectApiPathLiterals(source);
      for (const literal of literals) referencedPaths.add(literal);
    }

    expect(referencedPaths.size).toBeGreaterThan(0);
    for (const apiPath of referencedPaths) {
      expect(paths).toHaveProperty(apiPath);
    }
  });

  it("auth responses include canonical token fields (snake_case)", () => {
    const login200 = getResponseSchema(
      openapiSchema,
      "/api/v1/login",
      "post",
      "200",
    );
    const refresh200 = getResponseSchema(
      openapiSchema,
      "/api/v1/session/refresh",
      "post",
      "200",
    );

    const loginFields = collectPropertyPaths(openapiSchema, login200);
    expect(loginFields.has("access_token")).toBe(true);
    expect(loginFields.has("refresh_token")).toBe(true);
    expect(loginFields.has("session_token_id")).toBe(true);
    expect(loginFields.has("user")).toBe(true);

    const refreshFields = collectPropertyPaths(openapiSchema, refresh200);
    expect(refreshFields.has("access_token")).toBe(true);
    expect(refreshFields.has("refresh_token")).toBe(true);
    expect(refreshFields.has("session_token_id")).toBe(true);
  });

  it("checkout success response includes required fields", () => {
    const schema = getResponseSchema(
      openapiSchema,
      "/api/v1/checkout/success",
      "get",
      "200",
    );
    const fields = collectPropertyPaths(openapiSchema, schema);
    expect(fields.has("status")).toBe(true);
    expect(
      fields.has("updated_bid_credits") ||
        fields.has("payment_status") ||
        fields.has("message"),
    ).toBe(true);
  });

  it("bid placement response includes bid and auction objects", () => {
    const schema = getResponseSchema(
      openapiSchema,
      "/api/v1/auctions/{auction_id}/bids",
      "post",
      "200",
    );
    const fields = collectPropertyPaths(openapiSchema, schema);
    expect(fields.has("bid")).toBe(true);
    expect(fields.has("bidCredits")).toBe(true);
    expect(fields.has("success")).toBe(true);
  });
});

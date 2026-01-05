// @vitest-environment node
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

type JsonObject = Record<string, unknown>;

const readOpenApi = (): JsonObject => {
  const filePath = path.resolve(
    process.cwd(),
    process.env.BACKEND_OPENAPI_PATH?.trim() || "src/contracts/openapi.json",
  );
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as JsonObject;
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

describe("OpenAPI contract drift", () => {
  const openapi = readOpenApi();

  it("covers required FE endpoints", () => {
    const requiredPaths = [
      "/api/v1/signup",
      "/api/v1/login",
      "/api/v1/session/refresh",
      "/api/v1/checkouts",
      "/api/v1/checkout/success",
      "/api/v1/auctions/{auction_id}/bids",
    ];

    const paths = openapi.paths as JsonObject | undefined;
    expect(paths).toBeTruthy();

    for (const apiPath of requiredPaths) {
      expect(paths).toHaveProperty(apiPath);
    }
  });

  it("auth request payloads include canonical field names", () => {
    const loginSchema = getRequestSchema(openapi, "/api/v1/login", "post");
    const signupSchema = getRequestSchema(openapi, "/api/v1/signup", "post");
    const refreshSchema = getRequestSchema(
      openapi,
      "/api/v1/session/refresh",
      "post",
    );

    const loginFields = collectPropertyPaths(openapi, loginSchema);
    expect(
      loginFields.has("email_address") ||
        loginFields.has("session.email_address"),
    ).toBe(true);
    expect(
      loginFields.has("password") || loginFields.has("session.password"),
    ).toBe(true);

    const signupFields = collectPropertyPaths(openapi, signupSchema);
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

    const refreshFields = collectPropertyPaths(openapi, refreshSchema);
    expect(
      refreshFields.has("refresh_token") ||
        refreshFields.has("session.refresh_token") ||
        refreshFields.has("refresh.refresh_token"),
    ).toBe(true);
  });

  it("auth responses include canonical token fields (snake_case)", () => {
    const login200 = getResponseSchema(openapi, "/api/v1/login", "post", "200");
    const refresh200 = getResponseSchema(
      openapi,
      "/api/v1/session/refresh",
      "post",
      "200",
    );

    const loginFields = collectPropertyPaths(openapi, login200);
    expect(loginFields.has("access_token")).toBe(true);
    expect(loginFields.has("refresh_token")).toBe(true);
    expect(loginFields.has("session_token_id")).toBe(true);
    expect(loginFields.has("user")).toBe(true);

    const refreshFields = collectPropertyPaths(openapi, refresh200);
    expect(refreshFields.has("access_token")).toBe(true);
    expect(refreshFields.has("refresh_token")).toBe(true);
    expect(refreshFields.has("session_token_id")).toBe(true);
  });

  it("checkout success response includes required fields", () => {
    const schema = getResponseSchema(
      openapi,
      "/api/v1/checkout/success",
      "get",
      "200",
    );
    const fields = collectPropertyPaths(openapi, schema);
    expect(fields.has("status")).toBe(true);
    expect(fields.has("updated_bid_credits")).toBe(true);
  });

  it("bid placement response includes bid and auction objects", () => {
    const schema = getResponseSchema(
      openapi,
      "/api/v1/auctions/{auction_id}/bids",
      "post",
      "200",
    );
    const fields = collectPropertyPaths(openapi, schema);
    expect(fields.has("bid")).toBe(true);
    expect(fields.has("bidCredits")).toBe(true);
    expect(fields.has("success")).toBe(true);
  });
});

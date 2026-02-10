export type ProdSmokeTarget = {
  key: string;
  baseURL: string;
};

const DEFAULT_TARGETS: ProdSmokeTarget[] = [
  { key: "main", baseURL: "https://www.biddersweet.app" },
  { key: "afterdark", baseURL: "https://afterdark.biddersweet.app" },
  { key: "marketplace", baseURL: "https://marketplace.biddersweet.app" },
];

const normalizeUrl = (value: string): string => {
  const parsed = new URL(value.trim());
  return parsed.origin;
};

const parseTargetPair = (pair: string): ProdSmokeTarget => {
  const [rawKey, ...rawUrlParts] = pair.split("=");
  const key = (rawKey ?? "").trim().toLowerCase();
  const rawUrl = rawUrlParts.join("=").trim();
  if (!key) {
    throw new Error(
      `Invalid PROD_SMOKE_TARGETS item "${pair}". Expected format "<key>=https://host".`,
    );
  }
  if (!rawUrl) {
    throw new Error(
      `Missing URL for target "${key}". Expected format "<key>=https://host".`,
    );
  }

  return {
    key,
    baseURL: normalizeUrl(rawUrl),
  };
};

export const loadProdSmokeTargets = (): ProdSmokeTarget[] => {
  const rawTargets = process.env.PROD_SMOKE_TARGETS;

  if (!rawTargets || rawTargets.trim() === "") {
    return DEFAULT_TARGETS;
  }

  const parsed = rawTargets
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map(parseTargetPair);

  if (parsed.length === 0) {
    throw new Error(
      'PROD_SMOKE_TARGETS was provided but no valid targets were parsed. Expected: "main=https://www.biddersweet.app,afterdark=https://afterdark.biddersweet.app".',
    );
  }

  const seen = new Set<string>();
  for (const target of parsed) {
    if (seen.has(target.key)) {
      throw new Error(`Duplicate PROD_SMOKE_TARGETS key "${target.key}".`);
    }
    seen.add(target.key);
  }

  return parsed;
};

export const inferStorefrontKeyFromHostname = (hostname: string): string => {
  const normalized = hostname.toLowerCase();
  if (normalized.startsWith("afterdark.")) return "afterdark";
  if (normalized.startsWith("marketplace.")) return "marketplace";
  return "main";
};

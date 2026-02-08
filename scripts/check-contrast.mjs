import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import ts from "typescript";

const TEXT_THRESHOLD = 4.5;
const NON_TEXT_THRESHOLD = 1.5;

const rootDir = process.cwd();
const storefrontPath = path.join(rootDir, "src/storefront/storefront.ts");

function fail(message) {
  console.error(`contrast-check: ${message}`);
  process.exit(1);
}

function parseStorefrontConfigs(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  let targetNode = null;

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;
      if (declaration.name.text !== "STOREFRONT_CONFIGS") continue;
      if (!declaration.initializer || !ts.isObjectLiteralExpression(declaration.initializer)) {
        fail("Could not parse STOREFRONT_CONFIGS object initializer.");
      }
      targetNode = declaration.initializer;
    }
  }

  if (!targetNode) {
    fail("Could not find STOREFRONT_CONFIGS in src/storefront/storefront.ts.");
  }

  return evaluateObjectLiteral(targetNode, sourceFile);
}

function evaluateObjectLiteral(node, sourceFile) {
  const result = {};
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const key = getPropertyName(property.name, sourceFile);
    result[key] = evaluateExpression(property.initializer, sourceFile);
  }
  return result;
}

function evaluateExpression(node, sourceFile) {
  if (ts.isObjectLiteralExpression(node)) {
    return evaluateObjectLiteral(node, sourceFile);
  }

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (ts.isTemplateExpression(node)) {
    const head = node.head.text;
    const tail = node.templateSpans.map((span) => span.literal.text).join("");
    return `${head}${tail}`;
  }

  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }

  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;

  const text = node.getText(sourceFile);
  fail(`Unsupported expression in storefront config: ${text}`);
}

function getPropertyName(nameNode, sourceFile) {
  if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode)) {
    return nameNode.text;
  }
  if (ts.isComputedPropertyName(nameNode)) {
    fail(`Unsupported computed property in storefront config: ${nameNode.getText(sourceFile)}`);
  }
  fail(`Unsupported property name: ${nameNode.getText(sourceFile)}`);
}

function parseColor(raw) {
  const value = String(raw).trim().toLowerCase();

  if (value.startsWith("#")) {
    const hex = value.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      const a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1;
      return { r, g, b, a };
    }

    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      return { r, g, b, a };
    }
  }

  const rgbMatch = value.match(/^rgba?\((.+)\)$/);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(",").map((part) => part.trim());
    if (parts.length === 3 || parts.length === 4) {
      const r = Number(parts[0]);
      const g = Number(parts[1]);
      const b = Number(parts[2]);
      const a = parts.length === 4 ? Number(parts[3]) : 1;
      if ([r, g, b, a].every((n) => Number.isFinite(n))) {
        return { r, g, b, a };
      }
    }
  }

  fail(`Unsupported color format: "${raw}"`);
}

function clamp01(n) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function clamp255(n) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(255, n));
}

function composite(foreground, background) {
  const fgA = clamp01(foreground.a);
  const bgA = clamp01(background.a);
  const outA = fgA + bgA * (1 - fgA);

  if (outA === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  const r = (foreground.r * fgA + background.r * bgA * (1 - fgA)) / outA;
  const g = (foreground.g * fgA + background.g * bgA * (1 - fgA)) / outA;
  const b = (foreground.b * fgA + background.b * bgA * (1 - fgA)) / outA;

  return { r: clamp255(r), g: clamp255(g), b: clamp255(b), a: outA };
}

function toOpaque(color, backdrop = { r: 255, g: 255, b: 255, a: 1 }) {
  if (clamp01(color.a) >= 1) {
    return { r: clamp255(color.r), g: clamp255(color.g), b: clamp255(color.b), a: 1 };
  }
  return composite(color, backdrop);
}

function channelToLinear(channel) {
  const c = clamp255(channel) / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(color) {
  const c = toOpaque(color);
  const r = channelToLinear(c.r);
  const g = channelToLinear(c.g);
  const b = channelToLinear(c.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function formatRatio(value) {
  return `${value.toFixed(2)}:1`;
}

function runChecks() {
  const storefronts = parseStorefrontConfigs(storefrontPath);
  const failures = [];
  const passes = [];

  const check = ({ storefront, pair, fg, bg, threshold }) => {
    const ratio = contrastRatio(fg, bg);
    if (ratio < threshold) {
      failures.push({
        storefront,
        pair,
        ratio,
        threshold,
      });
      return;
    }
    passes.push({
      storefront,
      pair,
      ratio,
    });
  };

  const modes = ["light", "dark"];

  for (const [storefrontKey, config] of Object.entries(storefronts)) {
    const tokensByMode = config?.themeTokensByMode;
    if (!tokensByMode) {
      fail(`Missing themeTokensByMode for storefront "${storefrontKey}"`);
    }

    for (const mode of modes) {
      const tokens = tokensByMode[mode];
      if (!tokens) {
        fail(`Missing ${mode} tokens for storefront "${storefrontKey}"`);
      }

      const background = parseColor(tokens.background);
      const surfaceRaw = parseColor(tokens.surface);
      const surface = toOpaque(surfaceRaw, background);
      const primary = parseColor(tokens.primary);
      const accent = parseColor(tokens.accent);
      const onPrimary = parseColor(tokens.onPrimary);
      const focusRing = parseColor(tokens.focusRing);
      const borderRaw = parseColor(tokens.border);
      const borderOnSurface = toOpaque(borderRaw, surface);
      const borderOnBackground = toOpaque(borderRaw, background);

      check({
        storefront: `${storefrontKey}/${mode}`,
        pair: "onPrimary text on primary",
        fg: onPrimary,
        bg: primary,
        threshold: TEXT_THRESHOLD,
      });

      check({
        storefront: `${storefrontKey}/${mode}`,
        pair: "primary text on background",
        fg: primary,
        bg: background,
        threshold: TEXT_THRESHOLD,
      });

      check({
        storefront: `${storefrontKey}/${mode}`,
        pair: "primary text on surface",
        fg: primary,
        bg: surface,
        threshold: TEXT_THRESHOLD,
      });

      check({
        storefront: `${storefrontKey}/${mode}`,
        pair: "accent text on background",
        fg: accent,
        bg: background,
        threshold: TEXT_THRESHOLD,
      });

      check({
        storefront: `${storefrontKey}/${mode}`,
        pair: "accent text on surface",
        fg: accent,
        bg: surface,
        threshold: TEXT_THRESHOLD,
      });

      check({
        storefront: `${storefrontKey}/${mode}`,
        pair: "border vs surface",
        fg: borderOnSurface,
        bg: surface,
        threshold: NON_TEXT_THRESHOLD,
      });

      check({
        storefront: `${storefrontKey}/${mode}`,
        pair: "border vs background",
        fg: borderOnBackground,
        bg: background,
        threshold: NON_TEXT_THRESHOLD,
      });

      check({
        storefront: `${storefrontKey}/${mode}`,
        pair: "focus ring vs surface",
        fg: focusRing,
        bg: surface,
        threshold: 3,
      });

      check({
        storefront: `${storefrontKey}/${mode}`,
        pair: "focus ring vs background",
        fg: focusRing,
        bg: background,
        threshold: 3,
      });

      for (const [statusName, statusTokens] of Object.entries(tokens.status ?? {})) {
        const statusBgRaw = parseColor(statusTokens.bg);
        const statusText = parseColor(statusTokens.text);
        const statusBorderRaw = parseColor(statusTokens.border);

        const statusBgOnSurface = toOpaque(statusBgRaw, surface);
        const statusBgOnBackground = toOpaque(statusBgRaw, background);
        const statusBorderOnSurface = toOpaque(statusBorderRaw, statusBgOnSurface);
        const statusBorderOnBackground = toOpaque(statusBorderRaw, statusBgOnBackground);

        check({
          storefront: `${storefrontKey}/${mode}`,
          pair: `status.${statusName}.text on status.${statusName}.bg (on surface)`,
          fg: statusText,
          bg: statusBgOnSurface,
          threshold: TEXT_THRESHOLD,
        });

        check({
          storefront: `${storefrontKey}/${mode}`,
          pair: `status.${statusName}.text on status.${statusName}.bg (on background)`,
          fg: statusText,
          bg: statusBgOnBackground,
          threshold: TEXT_THRESHOLD,
        });

        check({
          storefront: `${storefrontKey}/${mode}`,
          pair: `status.${statusName}.border vs status.${statusName}.bg (on surface)`,
          fg: statusBorderOnSurface,
          bg: statusBgOnSurface,
          threshold: NON_TEXT_THRESHOLD,
        });

        check({
          storefront: `${storefrontKey}/${mode}`,
          pair: `status.${statusName}.border vs status.${statusName}.bg (on background)`,
          fg: statusBorderOnBackground,
          bg: statusBgOnBackground,
          threshold: NON_TEXT_THRESHOLD,
        });
      }
    }
  }

  if (failures.length > 0) {
    console.error("Contrast checks failed:");
    for (const failure of failures) {
      console.error(
        `- storefront=${failure.storefront} pair="${failure.pair}" ratio=${formatRatio(failure.ratio)} required=>=${failure.threshold}:1`,
      );
    }
    console.error(
      `\n${failures.length} failing pair(s), ${passes.length} passing pair(s). Update storefront theme tokens to meet thresholds.`,
    );
    process.exit(1);
  }

  console.log(
    `Contrast checks passed: ${passes.length} pair(s) across ${Object.keys(storefronts).length} storefront(s).`,
  );
}

runChecks();

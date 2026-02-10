import { expect, test } from "@playwright/test";
import { acceptAgeGateIfPresent } from "./prod/flows";

type RouteDiagnostic = {
  path: string;
  finalUrl: string;
  title: string;
  status: "public_ok" | "redirect_session_expired" | "redirect_login" | "other";
};

const ROUTES = ["/auctions", "/about", "/how-it-works"] as const;

const classify = (url: string): RouteDiagnostic["status"] => {
  const parsed = new URL(url);
  const isLogin = /\/login(?:[/?#]|$)/i.test(parsed.pathname);
  if (isLogin && parsed.searchParams.get("reason") === "session_expired") {
    return "redirect_session_expired";
  }
  if (isLogin) return "redirect_login";
  if (
    ROUTES.some(
      (path) => parsed.pathname === path || parsed.pathname === `${path}/`,
    )
  ) {
    return "public_ok";
  }
  return "other";
};

test("@p1 prod smoke: public access diagnostic", async ({ page }) => {
  const diagnostics: RouteDiagnostic[] = [];

  for (const path of ROUTES) {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response, `Missing document response for ${path}`).not.toBeNull();
    await acceptAgeGateIfPresent(page);

    const finalUrl = page.url();
    diagnostics.push({
      path,
      finalUrl,
      title: await page.title().catch(() => ""),
      status: classify(finalUrl),
    });
  }

  const serialized = JSON.stringify(diagnostics, null, 2);
  await test.info().attach("public-access-diagnostic.json", {
    contentType: "application/json",
    body: Buffer.from(serialized, "utf8"),
  });

  const failures = diagnostics.filter(
    (entry) => entry.status === "redirect_session_expired",
  );
  expect(
    failures,
    failures.length
      ? `Public access regression detected:\n${serialized}`
      : undefined,
  ).toEqual([]);
});

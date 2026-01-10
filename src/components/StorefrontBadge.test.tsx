import { render, screen } from "@testing-library/react";
import { StorefrontBadge } from "./StorefrontBadge";
import {
  STOREFRONT_CONFIGS,
  type StorefrontKey,
} from "../storefront/storefront";

describe("StorefrontBadge", () => {
  const storefrontKeys: StorefrontKey[] = ["main", "afterdark", "marketplace"];

  it.each(storefrontKeys)("renders the badge label for %s", (key) => {
    render(<StorefrontBadge storefrontKey={key} />);
    expect(
      screen.getByText(STOREFRONT_CONFIGS[key].badgeLabel),
    ).toBeInTheDocument();
  });

  it("renders nothing when no storefront key is provided", () => {
    const { container } = render(<StorefrontBadge storefrontKey={null} />);
    expect(container.firstChild).toBeNull();
  });
});

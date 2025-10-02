import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Auction } from "./Auction";

const mockAuctionProps = {
  id: 101,
  title: "Vintage Space Poster",
  description: "A rare original poster from the Apollo missions.",
  current_price: 42.5,
  image_url: "https://example.com/poster.jpg",
  onClick: vi.fn(),
  index: 3,
};

describe("Auction Component", () => {
  it("renders the auction details correctly", () => {
    render(<Auction {...mockAuctionProps} />);

    // Check for title
    expect(
      screen.getByRole("heading", { name: /Vintage Space Poster/i })
    ).toBeInTheDocument();

    // Check for description
    expect(
      screen.getByText("A rare original poster from the Apollo missions.")
    ).toBeInTheDocument();

    // Check for formatted price
    expect(screen.getByText("Current Price: $42.50")).toBeInTheDocument();
  });

  it("renders the image with the correct src and alt text", () => {
    render(<Auction {...mockAuctionProps} />);

    const image = screen.getByRole("img", { name: /Vintage Space Poster/i });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "https://example.com/poster.jpg");
  });

  it("calls the onClick handler with the correct id when clicked", () => {
    const handleClick = vi.fn();
    render(<Auction {...mockAuctionProps} onClick={handleClick} />);

    const component = screen.getByRole("heading", {
      name: /Vintage Space Poster/i,
    }).parentElement?.parentElement;

    if (component) {
      fireEvent.click(component);
    }

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(101);
  });

  it("applies the correct animation delay based on the index prop", () => {
    render(<Auction {...mockAuctionProps} index={3} />);

    const component = screen.getByRole("heading").parentElement?.parentElement;

    expect(component).toHaveStyle("animation: fadeInUp 0.5s 0.3s ease-out both");
  });
});
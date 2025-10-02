import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { About } from "./About";

/**
 * Helper function to render the component with a router context,
 * as the component uses <Link> from react-router-dom.
 */
const renderAboutPage = () => {
  return render(<About />, { wrapper: BrowserRouter });
};

describe("About Component", () => {
  it("renders without crashing", () => {
    renderAboutPage();
    // The test passes if no error is thrown during render.
  });

  it("displays the main hero headline", () => {
    renderAboutPage();
    const headline = screen.getByRole("heading", {
      name: /The Thrill of the Chase, The Pleasure of the Win./i,
    });
    expect(headline).toBeInTheDocument();
  });

  it("contains a call-to-action link to the auctions page", () => {
    renderAboutPage();
    const ctaLink = screen.getByRole("link", {
      name: /Start Your Bid-venture/i,
    });
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink).toHaveAttribute("href", "/auctions");
  });

  it("renders the 'Our Story' section", () => {
    renderAboutPage();
    const storyHeading = screen.getByRole("heading", {
      name: /Our Story: Our Tease/i,
    });
    expect(storyHeading).toBeInTheDocument();
  });

  it("renders all three company values", () => {
    renderAboutPage();
    expect(screen.getByText("Innovation")).toBeInTheDocument();
    expect(screen.getByText("Discretion")).toBeInTheDocument();
    expect(screen.getByText("The Thrill")).toBeInTheDocument();
  });

  it("renders all three team members", () => {
    renderAboutPage();
    expect(screen.getByText("Ken Rettberg")).toBeInTheDocument();
    expect(screen.getByText("Amay Champaneria")).toBeInTheDocument();
    expect(screen.getByText("Eric Vierhaus")).toBeInTheDocument();
  });
});
import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { BidHistory } from "./BidHistory";
import type { Bid } from "../../types/bid";

const mockBids: Bid[] = [
  {
    id: 1,
    amount: 150.5,
    created_at: new Date("2023-10-27T10:00:00Z").toISOString(),
    user_id: 1,
    username: "UserA",
  },
  {
    id: 2,
    amount: 151.0,
    created_at: new Date("2023-10-27T10:01:00Z").toISOString(),
    user_id: 2,
    username: "UserB",
  },
];

describe("BidHistory Component", () => {
  describe("when there are no bids", () => {
    it('should render a "No bids yet." message', () => {
      render(<BidHistory bids={[]} />);
      expect(screen.getByText("No bids yet.")).toBeInTheDocument();
    });

    it("should not render the 'Bid History' title", () => {
      render(<BidHistory bids={[]} />);
      expect(
        screen.queryByRole("heading", { name: /bid history/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("when bids are present", () => {
    beforeEach(() => {
      render(<BidHistory bids={mockBids} />);
    });

    it("should render the 'Bid History' title", () => {
      expect(
        screen.getByRole("heading", { name: /bid history/i })
      ).toBeInTheDocument();
    });

    it("should not render the 'No bids yet.' message", () => {
      expect(screen.queryByText("No bids yet.")).not.toBeInTheDocument();
    });

    it("should render a list with the correct number of bids", () => {
      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(mockBids.length);
    });

    it("should display the details for each bid correctly", () => {
      const listItems = screen.getAllByRole("listitem");

      // Check content of the first bid
      const firstBid = within(listItems[0]);
      expect(firstBid.getByText("UserA")).toBeInTheDocument();
      expect(firstBid.getByText("$150.50")).toBeInTheDocument();

      // Check content of the second bid
      const secondBid = within(listItems[1]);
      expect(secondBid.getByText("UserB")).toBeInTheDocument();
      expect(secondBid.getByText("$151.00")).toBeInTheDocument();
    });
  });
});
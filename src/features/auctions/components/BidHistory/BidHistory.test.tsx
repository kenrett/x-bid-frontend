import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BidHistory } from "./BidHistory";
import type { Bid } from "../../types/bid";

const mockBids: Bid[] = [
  {
    id: 1,
    amount: 150.5,
    created_at: new Date("2023-10-27T10:00:00Z").toISOString(),
    user_id: 1,
    username: "User A",
  },
  {
    id: 2,
    amount: 151.0,
    created_at: new Date("2023-10-27T10:01:00Z").toISOString(),
    user_id: 2,
    username: "User B",
  },
];

describe("BidHistory Component", () => {
  let dateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dateSpy = vi
      .spyOn(Date.prototype, "toLocaleString")
      .mockReturnValue("Jan 01, 10:00:00 UTC");
  });

  afterEach(() => {
    dateSpy.mockRestore();
  });

  describe("when there are no bids", () => {
    it('should render a "No bids yet." message', () => {
      render(<BidHistory bids={[]} />);
      expect(screen.getByText("No bids yet.")).toBeInTheDocument();
    });

    it("should not render the 'Bid History' title", () => {
      render(<BidHistory bids={[]} />);
      expect(
        screen.queryByRole("heading", { name: /bid history/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("when bids are present", () => {
    beforeEach(() => {
      render(<BidHistory bids={mockBids} />);
    });

    it("should render the 'Bid History' title", () => {
      expect(
        screen.getByRole("heading", { name: /bid history/i }),
      ).toBeInTheDocument();
    });

    it("should not render the 'No bids yet.' message", () => {
      expect(screen.queryByText("No bids yet.")).not.toBeInTheDocument();
    });

    it("should render a list with the correct number of bids", () => {
      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(mockBids.length);
    });

    it("should display the details for each bid, including formatted date", () => {
      const listItems = screen.getAllByRole("listitem");

      const firstItem = listItems[0]; // User B
      expect(firstItem).toHaveTextContent("User B");
      expect(firstItem).toHaveTextContent("$151.00");
      expect(firstItem).toHaveTextContent("Jan 01, 10:00:00 UTC");

      const secondItem = listItems[1]; // User A
      expect(secondItem).toHaveTextContent("User A");
      expect(secondItem).toHaveTextContent("$150.50");
      expect(secondItem).toHaveTextContent("Jan 01, 10:00:00 UTC");
    });
  });

  describe("with unsorted bids", () => {
    it("should render bids in descending chronological order", () => {
      render(<BidHistory bids={mockBids} />);

      const listItems = screen.getAllByRole("listitem");

      const firstItem = listItems[0];
      expect(firstItem).toHaveTextContent("User B"); // User B's bid is later
      expect(firstItem).toHaveTextContent("$151.00");

      const secondItem = listItems[1];
      expect(secondItem).toHaveTextContent("User A");
    });
  });

  describe("when multiple bids share the same timestamp", () => {
    it("uses the id tiebreaker to keep higher ids first", () => {
      const sameTimestamp = new Date("2023-10-27T10:00:00Z").toISOString();
      const bidsWithTie: Bid[] = [
        {
          id: 5,
          amount: 10,
          created_at: sameTimestamp,
          user_id: 1,
          username: "LaterId",
        },
        {
          id: 4,
          amount: 9,
          created_at: sameTimestamp,
          user_id: 2,
          username: "EarlierId",
        },
      ];

      render(<BidHistory bids={bidsWithTie} />);

      const listItems = screen.getAllByRole("listitem");
      expect(listItems[0]).toHaveTextContent("LaterId");
      expect(listItems[1]).toHaveTextContent("EarlierId");
    });
  });
});

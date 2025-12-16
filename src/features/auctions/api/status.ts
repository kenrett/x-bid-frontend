import type { AuctionStatus } from "../types/auction";

export const statusFromApi = (status: string | undefined): AuctionStatus => {
  if (status === "pending") return "scheduled";
  if (status === "ended") return "complete";
  if (status === "cancelled") return "cancelled";
  if (status === "active") return "active";
  if (status === "scheduled") return "scheduled";
  if (status === "complete") return "complete";
  return "inactive";
};

export const statusToApi = (status: AuctionStatus | undefined) => {
  if (status === "scheduled") return "pending";
  if (status === "complete") return "ended";
  return status ?? "inactive";
};

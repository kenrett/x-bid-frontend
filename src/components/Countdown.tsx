import { useState, useEffect, useCallback } from "react";
import type { AuctionStatus } from "../types/auction";

interface CountdownProps {
  endTime: string;
  status: AuctionStatus;
  onEnd: () => void;
}

/**
 * Formats milliseconds into a time string.
 * Shows hh:mm:ss if over an hour, otherwise mm:ss.
 */
function formatTime(milliseconds: number): string {
  if (milliseconds < 0) return "00:00";

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");

  if (hours > 0) return `${String(hours).padStart(2, "0")}:${paddedMinutes}:${paddedSeconds}`;
  return `${paddedMinutes}:${paddedSeconds}`;
}

export function Countdown({ endTime, status, onEnd }: CountdownProps) {
  const calculateRemaining = useCallback(() => {
    return new Date(endTime).getTime() - Date.now();
  }, [endTime]);

  const [timeRemaining, setTimeRemaining] = useState(() => formatTime(calculateRemaining()));

  useEffect(() => {
    if (status !== "active") {
      setTimeRemaining(status === "complete" ? "Auction Ended" : "00:00");
      return;
    }

    // Immediately update the timer when endTime changes, without waiting for the interval.
    setTimeRemaining(formatTime(calculateRemaining()));

    const intervalId = setInterval(() => {
      const remaining = new Date(endTime).getTime() - Date.now();

      if (remaining <= 0) {
        clearInterval(intervalId);
        setTimeRemaining("Auction Ended");
        onEnd();
      } else {
        setTimeRemaining(formatTime(remaining));
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [endTime, status, onEnd, calculateRemaining]);

  return <div className="text-3xl font-bold text-white">{timeRemaining}</div>;
}
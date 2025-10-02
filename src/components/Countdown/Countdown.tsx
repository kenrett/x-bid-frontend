import { useState, useEffect, useCallback } from "react";
import type { AuctionStatus } from "../../types/auction";

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
  const [timeRemaining, setTimeRemaining] = useState(() => {
    const remaining = new Date(endTime).getTime() - Date.now();
    return formatTime(remaining);
  });

  useEffect(() => {
    if (status !== "active") {
      setTimeRemaining(status === "complete" ? "Auction Ended" : "00:00");
      return;
    }
    const calculateRemaining = () => new Date(endTime).getTime() - Date.now();
    let intervalId: NodeJS.Timeout | undefined;

    const initialRemaining = calculateRemaining();

    if (initialRemaining > 0) {
      setTimeRemaining(formatTime(initialRemaining));

      intervalId = setInterval(() => {
        const remaining = calculateRemaining();

        if (remaining > 0) {
          setTimeRemaining(formatTime(remaining));
        } else {
          clearInterval(intervalId!); // Stop the timer.
          setTimeRemaining("00:00");
          onEnd(); // Call the onEnd callback once
        }
      }, 1000);
    } else {
      // If initial remaining is 0 or negative, just set to "00:00" and call onEnd if status is active
      setTimeRemaining("00:00");
      if (status === "active") onEnd(); // Only call onEnd if it was supposed to be active
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [endTime, status, onEnd]);

  return <div className="text-3xl font-bold text-white">{timeRemaining}</div>;
}

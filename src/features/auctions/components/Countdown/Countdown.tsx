import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { AuctionStatus } from "../../types/auction";

interface CountdownProps {
  endTime: string;
  status: AuctionStatus;
  onEnd: () => void;
}

function getRemainingMs(endTimestamp: number) {
  return endTimestamp - Date.now();
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

  if (hours > 0)
    return `${String(hours).padStart(2, "0")}:${paddedMinutes}:${paddedSeconds}`;
  return `${paddedMinutes}:${paddedSeconds}`;
}

export function Countdown({ endTime, status, onEnd }: CountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState(() => {
    if (status === "complete") return "Auction Ended";
    if (status !== "active") return "00:00";

    const initialTimestamp = new Date(endTime).getTime();
    const remaining = getRemainingMs(initialTimestamp);
    return remaining <= 0 ? "00:00" : formatTime(remaining);
  });
  const hasEndedRef = useRef(false);
  const onEndRef = useRef(onEnd);
  const endTimestamp = useMemo(() => new Date(endTime).getTime(), [endTime]);

  // Keep the ref updated with the latest onEnd function
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    hasEndedRef.current = false;
  }, [endTime]);
  // Reset when an auction transitions into an active state.
  useEffect(() => {
    if (status === "active") {
      hasEndedRef.current = false;
    }
  }, [status]);

  const notifyEnd = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    onEndRef.current();
  }, []);

  useEffect(() => {
    const remainingMs = getRemainingMs(endTimestamp);
    let intervalId: number | null = null;
    let timeoutId: number | null = null;

    // Non-active auctions shouldn't keep ticking.
    if (status !== "active") {
      setTimeRemaining(status === "complete" ? "Auction Ended" : "00:00");
      return;
    }

    // If the timer is already expired, notify immediately and avoid setting up an interval.
    if (remainingMs <= 0) {
      setTimeRemaining("00:00");
      notifyEnd();
      return;
    }

    // Start ticking for active auctions with time left.
    setTimeRemaining(formatTime(remainingMs));

    const tick = () => {
      const nextRemaining = getRemainingMs(endTimestamp);

      if (nextRemaining <= 0) {
        if (intervalId !== null) {
          window.clearInterval(intervalId);
        }
        setTimeRemaining("00:00");
        notifyEnd();
      } else {
        setTimeRemaining(formatTime(nextRemaining));
      }
    };

    const initialDelay = Math.max(0, 1000 - (Date.now() % 1000));
    timeoutId = window.setTimeout(() => {
      tick(); // Align the first tick to the next second boundary.
      intervalId = window.setInterval(tick, 1000);
    }, initialDelay);

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      window.clearInterval(intervalId ?? 0);
    };
  }, [endTimestamp, status, notifyEnd]);

  return (
    <div className="text-3xl font-bold text-[color:var(--sf-text)]">
      {timeRemaining}
    </div>
  );
}

import { useEffect, useRef } from "react";

export function ErrorScreen({ message }: { message: string }) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  return (
    <div
      ref={rootRef}
      className="font-sans bg-[#0d0d1a] text-red-400 text-lg text-center p-8 min-h-screen"
      role="alert"
      tabIndex={-1}
    >
      {message}
    </div>
  );
}

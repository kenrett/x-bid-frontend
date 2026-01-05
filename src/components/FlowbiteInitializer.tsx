import { useEffect } from "react";

export function FlowbiteInitializer() {
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { initFlowbite } = await import("flowbite");
      if (cancelled) return;
      initFlowbite();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

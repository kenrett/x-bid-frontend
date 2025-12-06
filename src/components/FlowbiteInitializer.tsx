import { useEffect } from "react";
import { initFlowbite } from "flowbite";

export function FlowbiteInitializer() {
  useEffect(() => {
    initFlowbite();
  }, []);

  return null;
}

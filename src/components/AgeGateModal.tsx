import { useSyncExternalStore } from "react";
import { ConfirmModal } from "./ConfirmModal";
import {
  acceptAgeGate,
  ageGateStore,
  cancelAgeGate,
} from "../ageGate/ageGateStore";

export const AgeGateModal = () => {
  const snapshot = useSyncExternalStore(
    ageGateStore.subscribe,
    ageGateStore.getSnapshot,
    ageGateStore.getSnapshot,
  );

  return (
    <ConfirmModal
      open={snapshot.open}
      title="Adults only (18+)"
      description="This storefront contains adult content. You must confirm you are 18+ to continue."
      confirmLabel="I am 18+"
      cancelLabel="Cancel"
      onConfirm={acceptAgeGate}
      onCancel={cancelAgeGate}
    />
  );
};

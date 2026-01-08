type AgeGateState = {
  open: boolean;
  pending: boolean;
};

type Listener = () => void;

let state: AgeGateState = { open: false, pending: false };
const listeners = new Set<Listener>();

let acceptancePromise: Promise<void> | null = null;
let resolveAcceptance: (() => void) | null = null;
let rejectAcceptance: ((reason?: unknown) => void) | null = null;

const emit = () => {
  for (const listener of listeners) listener();
};

export const ageGateStore = {
  getSnapshot: (): AgeGateState => state,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  reset: () => {
    state = { open: false, pending: false };
    acceptancePromise = null;
    resolveAcceptance = null;
    rejectAcceptance = null;
    emit();
  },
};

export const requestAgeGateAcceptance = (): Promise<void> => {
  if (acceptancePromise) return acceptancePromise;

  state = { open: true, pending: true };
  emit();

  acceptancePromise = new Promise<void>((resolve, reject) => {
    resolveAcceptance = resolve;
    rejectAcceptance = reject;
  }).finally(() => {
    acceptancePromise = null;
    resolveAcceptance = null;
    rejectAcceptance = null;
    state = { open: false, pending: false };
    emit();
  });

  return acceptancePromise;
};

export const acceptAgeGate = () => {
  resolveAcceptance?.();
};

export const cancelAgeGate = () => {
  rejectAcceptance?.(new Error("age_gate_declined"));
};

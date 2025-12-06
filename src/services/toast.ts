export type ToastVariant = "info" | "success" | "error";

export type ToastMessage = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastListener = (toast: ToastMessage) => void;

const listeners = new Set<ToastListener>();

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const showToast = (message: string, variant: ToastVariant = "info") => {
  const toast: ToastMessage = { id: createId(), message, variant };
  listeners.forEach((listener) => listener(toast));
};

export const subscribeToToasts = (listener: ToastListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

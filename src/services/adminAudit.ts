type Payload = Record<string, unknown> | undefined;

export const logAdminAction = (action: string, payload?: Payload) => {
  // Client-side audit placeholder; replace with backend logging when available.
  try {
    const entry = {
      action,
      payload,
      at: new Date().toISOString(),
    };
    console.info("[admin:audit]", entry);
  } catch (error) {
    console.error("[admin:audit] failed to log action", error);
  }
};

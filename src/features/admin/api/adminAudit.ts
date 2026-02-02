import client from "@api/client";

type Payload = Record<string, unknown> | undefined;

export const logAdminAction = (action: string, payload?: Payload) => {
  // Fire-and-forget server-side audit; errors are logged but not thrown.
  const sendAudit = async () => {
    try {
      if (typeof window === "undefined") return; // skip during SSR/tests
      await client.post("/api/v1/admin/audit", {
        audit: { action, payload },
      });
    } catch (error) {
      console.error("[admin:audit] failed to log action", error);
    }
  };

  void sendAudit();
};

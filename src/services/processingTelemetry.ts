type ProcessingPayload = Record<string, unknown>;

export const logProcessingEvent = (
  event: string,
  payload: ProcessingPayload,
) => {
  if (import.meta.env.MODE === "test") return;
  console.info("[processing]", { event, ...payload });
};

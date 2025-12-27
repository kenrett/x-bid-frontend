import * as ActionCable from "@rails/actioncable";

const getStoredToken = () =>
  typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;

const buildCableUrl = (
  tokenOverride?: string | null,
  baseOverride?: string,
) => {
  const base = String(
    baseOverride ??
      import.meta.env.VITE_CABLE_URL ??
      "ws://localhost:3000/cable",
  );
  const url = new URL(base);
  const token = tokenOverride ?? getStoredToken();
  if (token) {
    url.searchParams.set("token", token);
  }
  return url.toString();
};

type CreateConsumerFn = typeof ActionCable.createConsumer;

const getCreateConsumer = (): CreateConsumerFn => {
  const maybeMock = (
    globalThis as {
      __mockCreateConsumer?: CreateConsumerFn;
    }
  ).__mockCreateConsumer;
  return maybeMock ?? ActionCable.createConsumer;
};

const getAdapters = () =>
  (
    ActionCable as unknown as {
      adapters?: { WebSocket?: typeof WebSocket };
    }
  ).adapters;

const buildAuthorizedWebSocket = (BaseWebSocket?: typeof WebSocket) => {
  if (!BaseWebSocket) return undefined;

  return class AuthorizedWebSocket extends BaseWebSocket {
    constructor(url: string, protocols?: string | string[]) {
      const token = getStoredToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const args: unknown[] = headers
        ? [url, protocols as unknown, { headers }]
        : [url, protocols as unknown];
      // `ws` (Node) accepts headers as a third argument; browsers ignore extras.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      super(...args);
    }
  };
};

const createCableConsumer = () => {
  const adapters = getAdapters();
  const AuthorizedWebSocket = buildAuthorizedWebSocket(adapters?.WebSocket);
  if (AuthorizedWebSocket && adapters) {
    adapters.WebSocket = AuthorizedWebSocket as typeof adapters.WebSocket;
  }
  return getCreateConsumer()(buildCableUrl());
};

let cable = createCableConsumer();

export const resetCable = () => {
  try {
    cable.disconnect();
  } catch (err) {
    console.warn("[cable] Failed to disconnect existing consumer", err);
  }
  cable = createCableConsumer();
  return cable;
};

export { cable, buildCableUrl };

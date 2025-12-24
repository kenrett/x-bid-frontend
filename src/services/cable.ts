import { adapters, createConsumer } from "@rails/actioncable";

// Attach JWT via Authorization header so the backend can authorize the websocket handshake.
const buildCableUrl = () => {
  const base = String(
    import.meta.env.VITE_CABLE_URL ?? "ws://localhost:3000/cable",
  );
  return new URL(base).toString();
};

type CreateConsumerFn = typeof createConsumer;

const getCreateConsumer = (): CreateConsumerFn => {
  const maybeMock = (
    globalThis as {
      __mockCreateConsumer?: CreateConsumerFn;
    }
  ).__mockCreateConsumer;
  return maybeMock ?? createConsumer;
};

const buildAuthorizedWebSocket = () => {
  const BaseWebSocket = adapters.WebSocket;
  if (!BaseWebSocket) return undefined;

  return class AuthorizedWebSocket extends BaseWebSocket {
    constructor(url: string, protocols?: string | string[]) {
      const token =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("token")
          : null;
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
  const AuthorizedWebSocket = buildAuthorizedWebSocket();
  if (AuthorizedWebSocket) {
    adapters.WebSocket = AuthorizedWebSocket;
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

export { cable };

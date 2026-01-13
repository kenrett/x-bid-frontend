import * as ActionCable from "@rails/actioncable";
import { authSessionStore } from "@features/auth/tokenStore";
import { getStorefrontKey } from "@storefront/storefront";
import { getCableRuntimeInfo } from "./cableUrl";

type CreateConsumerFn = typeof ActionCable.createConsumer;

const getCreateConsumer = (): CreateConsumerFn => {
  const maybeMock = (
    globalThis as {
      __mockCreateConsumer?: CreateConsumerFn;
    }
  ).__mockCreateConsumer;
  return maybeMock ?? ActionCable.createConsumer;
};

let didLogStartup = false;

const logStartup = () => {
  if (didLogStartup) return;
  didLogStartup = true;
  const info = getCableRuntimeInfo();
  console.info("[cable] init", {
    storefront_key: getStorefrontKey(),
    window_origin:
      typeof window === "undefined" ? undefined : window.location?.origin,
    VITE_API_URL: info.apiUrl,
    VITE_CABLE_URL: info.cableUrl,
    computedCableUrl: info.computedCableUrl,
  });
};

const logDisconnect = (
  info: ReturnType<typeof getCableRuntimeInfo>,
  event?: CloseEvent,
  reconnecting?: boolean,
) => {
  console.warn("[cable] disconnected", {
    computedCableUrl: info.computedCableUrl,
    closeCode: event?.code,
    closeReason: event?.reason,
    reconnecting: Boolean(reconnecting),
  });
};

const attachConnectionLogging = (consumer: ActionCable.Consumer) => {
  const connection = (consumer as { connection?: Record<string, unknown> })
    .connection as
    | (Record<string, unknown> & {
        webSocket?: WebSocket;
        monitor?: { reconnectAttempts?: number; reconnecting?: boolean };
        open?: () => void;
      })
    | undefined;
  if (
    !connection ||
    (connection as { __xBidLoggingAttached?: boolean }).__xBidLoggingAttached
  ) {
    return;
  }

  (connection as { __xBidLoggingAttached?: boolean }).__xBidLoggingAttached =
    true;
  const info = getCableRuntimeInfo();

  const attachToSocket = () => {
    const webSocket = connection.webSocket;
    if (
      !webSocket ||
      (webSocket as { __xBidLoggingAttached?: boolean }).__xBidLoggingAttached
    ) {
      return;
    }
    (webSocket as { __xBidLoggingAttached?: boolean }).__xBidLoggingAttached =
      true;
    if (typeof webSocket.addEventListener === "function") {
      webSocket.addEventListener("close", (event) => {
        const reconnecting =
          connection.monitor?.reconnecting ??
          (connection.monitor?.reconnectAttempts ?? 0) > 0;
        logDisconnect(info, event, reconnecting);
      });
    }
  };

  const originalOpen = connection.open?.bind(connection);
  if (originalOpen) {
    connection.open = () => {
      const result = originalOpen();
      attachToSocket();
      return result;
    };
  }

  attachToSocket();
};

const createCableConsumer = () => {
  const info = getCableRuntimeInfo();
  logStartup();
  const consumer = getCreateConsumer()(info.computedCableUrl);
  attachConnectionLogging(consumer);
  return consumer;
};

const hasCableSession = () => {
  const snapshot = authSessionStore.getSnapshot();
  return Boolean(snapshot.user);
};

let consumer: ActionCable.Consumer | null = null;

const ensureConsumer = (): ActionCable.Consumer | null => {
  if (consumer) return consumer;
  if (!hasCableSession()) return null;
  consumer = createCableConsumer();
  return consumer;
};

const noopSubscription: ActionCable.Subscription = {
  unsubscribe: () => {},
};

export const resetCable = () => {
  try {
    consumer?.disconnect();
  } catch (err) {
    console.warn("[cable] Failed to disconnect existing consumer", err);
  }
  consumer = null;
  return ensureConsumer();
};

const cable: ActionCable.Consumer = {
  connect: () => {
    const active = ensureConsumer();
    if (active) {
      active.connect();
    }
  },
  disconnect: () => {
    if (!consumer) return;
    consumer.disconnect();
    consumer = null;
  },
  subscriptions: {
    create: (identifier, callbacks) => {
      const active = ensureConsumer();
      if (!active) return noopSubscription;
      return active.subscriptions.create(identifier, callbacks);
    },
  },
};

export { cable };

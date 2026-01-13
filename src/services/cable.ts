import * as ActionCable from "@rails/actioncable";
import { authSessionStore, getAccessToken } from "@features/auth/tokenStore";
import { getStorefrontKey } from "../storefront/storefront";
import { getCableConnectionInfo, getCableRuntimeInfo } from "./cableUrl";
import { showToast } from "./toast";

const redactCableUrl = (url: string): string => {
  try {
    const base =
      typeof window === "undefined"
        ? "http://localhost"
        : (window.location?.origin ?? "http://localhost");
    const parsed = new URL(url, base);
    if (parsed.searchParams.has("token")) {
      parsed.searchParams.set("token", "***");
    }
    return parsed.toString();
  } catch {
    return url.replace(/token=[^&]+/gi, "token=***");
  }
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

let didLogStartup = false;
let didShowDisconnectToast = false;
let reconnectAttempts = 0;
let reconnectTimeoutId: number | null = null;
let suppressNextDisconnectLog = false;

const clearReconnect = () => {
  if (reconnectTimeoutId) {
    window.clearTimeout(reconnectTimeoutId);
    reconnectTimeoutId = null;
  }
  reconnectAttempts = 0;
  didShowDisconnectToast = false;
};

const scheduleReconnect = () => {
  if (reconnectTimeoutId || !hasCableSession()) return;
  const delay = Math.min(1000 * 2 ** reconnectAttempts, 30_000);
  reconnectAttempts += 1;
  reconnectTimeoutId = window.setTimeout(() => {
    reconnectTimeoutId = null;
    if (!hasCableSession()) return;
    consumer = null;
    const next = ensureConsumer();
    next?.connect();
  }, delay);
};

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
  if (import.meta.env.MODE === "development") {
    const token = getAccessToken();
    const connectionInfo = getCableConnectionInfo(token);
    console.debug("[cable] dev", {
      storefront_key: connectionInfo.storefrontKey,
      token_present: connectionInfo.tokenPresent,
      ws_url: redactCableUrl(connectionInfo.connectionUrl),
    });
  }
};

const logDisconnect = (
  info: ReturnType<typeof getCableRuntimeInfo>,
  event?: CloseEvent,
  reconnecting?: boolean,
) => {
  if (suppressNextDisconnectLog) {
    suppressNextDisconnectLog = false;
    return;
  }
  console.warn("[cable] disconnected", {
    computedCableUrl: info.computedCableUrl,
    closeCode: event?.code,
    closeReason: event?.reason,
    reconnecting: Boolean(reconnecting) || Boolean(reconnectTimeoutId),
  });
  if (!didShowDisconnectToast && import.meta.env.MODE !== "test") {
    didShowDisconnectToast = true;
    showToast("Realtime disconnected; refresh or re-login if actions fail.");
  }
  scheduleReconnect();
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
      webSocket.addEventListener("open", () => {
        clearReconnect();
      });
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
  const token = getAccessToken();
  const info = getCableConnectionInfo(token);
  logStartup();
  const consumer = getCreateConsumer()(info.connectionUrl);
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

let lastAccessToken = authSessionStore.getSnapshot().accessToken;
authSessionStore.subscribe(() => {
  const nextToken = authSessionStore.getSnapshot().accessToken;
  if (nextToken === lastAccessToken) return;
  lastAccessToken = nextToken;
  if (consumer) {
    resetCable();
  }
});

const noopSubscription: ActionCable.Subscription = {
  unsubscribe: () => {},
};

export const resetCable = () => {
  try {
    suppressNextDisconnectLog = true;
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
    suppressNextDisconnectLog = true;
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

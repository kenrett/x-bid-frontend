import * as ActionCable from "@rails/actioncable";
import { authSessionStore } from "@features/auth/tokenStore";
import { getStorefrontKey } from "../storefront/storefront";
import { getCableConnectionInfo, getCableRuntimeInfo } from "./cableUrl";
import { showToast } from "./toast";
import {
  isDebugAuthEnabled,
  recordWsAttempt,
  updateWsAttempt,
} from "../debug/authDebug";

const redactCableUrl = (url: string): string => {
  try {
    const base =
      typeof window === "undefined"
        ? "http://localhost"
        : (window.location?.origin ?? "http://localhost");
    const parsed = new URL(url, base);
    return parsed.toString();
  } catch {
    return url;
  }
};

const getHostFromUrl = (url: string | undefined): string | null => {
  if (!url) return null;
  try {
    const base =
      typeof window === "undefined"
        ? "http://localhost"
        : (window.location?.origin ?? "http://localhost");
    return new URL(url, base).host;
  } catch {
    return null;
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
    const connectionInfo = getCableConnectionInfo();
    console.debug("[cable] dev", {
      storefront_key: connectionInfo.storefrontKey,
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
  const cableHost = getHostFromUrl(info.computedCableUrl);
  const apiHost = getHostFromUrl(info.apiUrl);
  const hint =
    cableHost && apiHost && cableHost !== apiHost
      ? "Cable host differs from API host; cookies may not be shared."
      : undefined;

  console.warn("[cable] disconnected", {
    computedCableUrl: info.computedCableUrl,
    closeCode: event?.code,
    closeReason: event?.reason,
    reconnecting: Boolean(reconnecting) || Boolean(reconnectTimeoutId),
    cableHost,
    apiHost,
    hint,
  });
  if (!didShowDisconnectToast && import.meta.env.MODE !== "test") {
    didShowDisconnectToast = true;
    showToast("Realtime disconnected; refresh or re-login if actions fail.");
  }
  scheduleReconnect();
};

const attachConnectionLogging = (
  consumer: ActionCable.Consumer,
  debugAttemptId: string | undefined,
  connectionUrl: string,
) => {
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
        if (import.meta.env.MODE === "development") {
          console.info("[cable] connected", {
            url: redactCableUrl(connectionUrl),
          });
        }
        if (isDebugAuthEnabled()) {
          console.info("[cable debug] connected", {
            url: redactCableUrl(connectionUrl),
          });
        }
      });
      webSocket.addEventListener("close", (event) => {
        const reconnecting =
          connection.monitor?.reconnecting ??
          (connection.monitor?.reconnectAttempts ?? 0) > 0;
        logDisconnect(info, event, reconnecting);
        if (import.meta.env.MODE === "development") {
          console.info("[cable] closed", {
            closeCode: event.code,
            closeReason: event.reason,
            reconnecting,
          });
        }
        if (debugAttemptId && isDebugAuthEnabled()) {
          updateWsAttempt(debugAttemptId, {
            closeCode: event.code,
            closeReason: event.reason,
          });
          console.warn("[cable debug] disconnected", {
            closeCode: event.code,
            closeReason: event.reason,
          });
        }
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
  const info = getCableConnectionInfo();
  logStartup();
  const debugAttemptId = isDebugAuthEnabled()
    ? recordWsAttempt({
        timestamp: Date.now(),
        url: redactCableUrl(info.connectionUrl),
        didIncludeTokenParam: false,
      })
    : undefined;
  if (isDebugAuthEnabled()) {
    console.info("[cable debug] connect attempt", {
      url: redactCableUrl(info.connectionUrl),
      storefront_key: info.storefrontKey,
    });
  }
  const consumer = getCreateConsumer()(info.connectionUrl);
  attachConnectionLogging(consumer, debugAttemptId, info.connectionUrl);
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

authSessionStore.subscribe(() => {
  if (consumer && !hasCableSession()) {
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

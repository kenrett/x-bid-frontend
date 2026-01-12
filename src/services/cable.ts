import * as ActionCable from "@rails/actioncable";
import { authSessionStore } from "@features/auth/tokenStore";

const buildCableUrl = (baseOverride?: string) =>
  String(baseOverride ?? import.meta.env.VITE_CABLE_URL ?? "/cable");

type CreateConsumerFn = typeof ActionCable.createConsumer;

const getCreateConsumer = (): CreateConsumerFn => {
  const maybeMock = (
    globalThis as {
      __mockCreateConsumer?: CreateConsumerFn;
    }
  ).__mockCreateConsumer;
  return maybeMock ?? ActionCable.createConsumer;
};

const createCableConsumer = () => {
  return getCreateConsumer()(buildCableUrl());
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

export { cable, buildCableUrl };

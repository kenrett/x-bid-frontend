declare module "@rails/actioncable" {
  export type Subscription = {
    unsubscribe(): void;
  };

  export type Subscriptions = {
    create(
      identifier: Record<string, unknown>,
      callbacks: { received?: (data: unknown) => void },
    ): Subscription;
  };

  export type Consumer = {
    subscriptions: Subscriptions;
    connect(): void;
    disconnect(): void;
  };

  export function createConsumer(url: string): Consumer;
}

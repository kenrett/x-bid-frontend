declare module "@rails/actioncable" {
  // You can add more specific types here if you want,
  // but this is the minimum to resolve the error.
  export function createConsumer(url: string): any;
}

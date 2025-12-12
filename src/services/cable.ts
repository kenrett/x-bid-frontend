import { createConsumer } from "@rails/actioncable";

// Attach JWT + session token to the ActionCable URL so the backend Connection
// (which requires authentication) can authorize the websocket handshake.
const buildCableUrl = () => {
  const base = String(
    import.meta.env.VITE_CABLE_URL ?? "ws://localhost:3000/cable",
  );
  const url = new URL(base);

  const token = localStorage.getItem("token");
  const sessionTokenId = localStorage.getItem("sessionTokenId");

  if (token) url.searchParams.set("token", token);
  if (sessionTokenId) url.searchParams.set("session_token_id", sessionTokenId);

  return url.toString();
};

let cable = createConsumer(buildCableUrl());

export const resetCable = () => {
  try {
    cable.disconnect();
  } catch (err) {
    console.warn("[cable] Failed to disconnect existing consumer", err);
  }
  cable = createConsumer(buildCableUrl());
  return cable;
};

export { cable };

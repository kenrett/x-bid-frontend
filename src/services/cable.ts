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

export const cable = createConsumer(buildCableUrl());

import { createConsumer } from "@rails/actioncable";

// Use environment variables for the WebSocket URL
const cableUrl = import.meta.env.VITE_CABLE_URL || "ws://localhost:3000/cable";
// add VITE_CABLE_URL=wss://your-production-app.com/cable
export const cable = createConsumer(cableUrl);

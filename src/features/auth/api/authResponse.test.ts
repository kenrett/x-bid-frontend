import { describe, expect, it } from "vitest";
import { normalizeAuthResponse } from "./authResponse";

describe("normalizeAuthResponse", () => {
  it("accepts backend login payload with numeric session_token_id", () => {
    const payload = {
      token: "token",
      refresh_token: "refresh",
      session_token_id: 34,
      session: {
        session_token_id: 34,
        session_expires_at: "2025-01-01T00:00:00Z",
        seconds_remaining: 1799,
      },
      is_admin: false,
      is_superuser: false,
      redirect_path: null,
      user: {
        id: 3,
        name: "User One",
        emailAddress: "user@example.com",
        bidCredits: 463,
        is_admin: false,
        is_superuser: false,
      },
    };

    expect(normalizeAuthResponse(payload)).toEqual({
      token: "token",
      refreshToken: "refresh",
      sessionTokenId: "34",
      user: {
        id: 3,
        name: "User One",
        email: "user@example.com",
        bidCredits: 463,
        is_admin: false,
        is_superuser: false,
      },
    });
  });

  it("accepts camelCase token keys", () => {
    const payload = {
      token: "token",
      refreshToken: "refresh",
      sessionTokenId: "99",
      user: { id: 1, name: "Casey", email: "casey@example.com", bidCredits: 0 },
    };

    expect(normalizeAuthResponse(payload)).toMatchObject({
      token: "token",
      refreshToken: "refresh",
      sessionTokenId: "99",
      user: { email: "casey@example.com" },
    });
  });
});

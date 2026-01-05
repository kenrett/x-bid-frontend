import { describe, expect, it } from "vitest";
import { normalizeAuthResponse } from "./authResponse";

describe("normalizeAuthResponse", () => {
  it("accepts backend login payload with numeric session_token_id", () => {
    const payload = {
      access_token: "token",
      refresh_token: "refresh",
      session_token_id: 34,
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
      accessToken: "token",
      refreshToken: "refresh",
      sessionTokenId: "34",
      user: {
        id: 3,
        name: "User One",
        email: "user@example.com",
        bidCredits: 463,
        is_admin: false,
        is_superuser: false,
        email_verified: null,
        email_verified_at: null,
      },
    });
  });

  it("fails loudly when v1 fields are missing", () => {
    const payload = {
      token: "token",
      refreshToken: "refresh",
      sessionTokenId: "99",
      user: { id: 1, name: "Casey", email: "casey@example.com", bidCredits: 0 },
    };

    expect(() => normalizeAuthResponse(payload)).toThrow(
      /Unexpected auth response/i,
    );
  });

  it("does not report missing session_token_id for non-JSON payloads", () => {
    expect(() => normalizeAuthResponse("<html>not found</html>")).toThrow(
      /expected JSON object/i,
    );
  });
});

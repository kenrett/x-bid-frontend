import { describe, expect, it } from "vitest";
import { normalizeAuthResponse } from "./authResponse";

describe("normalizeAuthResponse", () => {
  it("accepts backend login payload and normalizes the user", () => {
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

  it("fails loudly when user data is missing", () => {
    const payload = {
      token: "token",
      refreshToken: "refresh",
      sessionTokenId: "99",
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

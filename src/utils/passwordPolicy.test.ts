import { describe, expect, it } from "vitest";
import {
  validatePassword,
  DEFAULT_PASSWORD_POLICY,
} from "./passwordPolicy";

describe("validatePassword", () => {
  it("accepts a password meeting the platform default policy", () => {
    expect(validatePassword("password1", DEFAULT_PASSWORD_POLICY)).toBeNull();
  });

  it("rejects a password shorter than the configured minimum", () => {
    const error = validatePassword("short", { minLength: 8, requireSpecialChars: false });
    expect(error).toMatch(/at least 8 characters/);
  });

  it("accepts a password exactly at the configured minimum length", () => {
    expect(
      validatePassword("exactly8", { minLength: 8, requireSpecialChars: false }),
    ).toBeNull();
  });

  it("rejects a password with no special character when required", () => {
    const error = validatePassword("longenough", {
      minLength: 8,
      requireSpecialChars: true,
    });
    expect(error).toMatch(/special character/);
  });

  it("accepts a password with a special character when required", () => {
    expect(
      validatePassword("longenough!", {
        minLength: 8,
        requireSpecialChars: true,
      }),
    ).toBeNull();
  });

  it("checks length before special-character requirement", () => {
    const error = validatePassword("sh!", { minLength: 8, requireSpecialChars: true });
    expect(error).toMatch(/at least 8 characters/);
  });
});

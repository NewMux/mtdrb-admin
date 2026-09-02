import { describe, expect, it } from "vitest";
import {
  isProtectedRoute,
  isAuthRoute,
  shouldRedirectToDefaultPage,
} from "./routePreservation";

describe("isProtectedRoute", () => {
  it("recognizes an exact protected route", () => {
    expect(isProtectedRoute("/dashboard")).toBe(true);
    expect(isProtectedRoute("/dashboard/members")).toBe(true);
  });

  it("recognizes a nested path under a protected route", () => {
    expect(isProtectedRoute("/dashboard/members/123")).toBe(true);
  });

  it("does not treat an unrelated path as protected", () => {
    expect(isProtectedRoute("/login")).toBe(false);
    expect(isProtectedRoute("/")).toBe(false);
  });

  it("does not match a sibling path that merely shares a string prefix", () => {
    // A path like "/dashboard-public" must not be classified as protected
    // just because it starts with the characters "/dashboard".
    expect(isProtectedRoute("/dashboard-public")).toBe(false);
    expect(isProtectedRoute("/membership-plans")).toBe(false);
  });
});

describe("isAuthRoute", () => {
  it("recognizes the known auth routes", () => {
    expect(isAuthRoute("/")).toBe(true);
    expect(isAuthRoute("/login")).toBe(true);
    expect(isAuthRoute("/signup")).toBe(true);
    expect(isAuthRoute("/subscribe")).toBe(true);
  });

  it("requires an exact match, not a prefix match", () => {
    expect(isAuthRoute("/login/reset")).toBe(false);
  });

  it("does not treat a dashboard path as an auth route", () => {
    expect(isAuthRoute("/dashboard")).toBe(false);
  });
});

describe("shouldRedirectToDefaultPage", () => {
  it("redirects from auth pages", () => {
    expect(shouldRedirectToDefaultPage("/login")).toBe(true);
    expect(shouldRedirectToDefaultPage("/")).toBe(true);
  });

  it("does not redirect from a dashboard page", () => {
    expect(shouldRedirectToDefaultPage("/dashboard")).toBe(false);
  });

  it("does not redirect from an unrecognized page", () => {
    expect(shouldRedirectToDefaultPage("/some-random-path")).toBe(false);
  });
});

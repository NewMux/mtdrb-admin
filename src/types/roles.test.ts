import { describe, expect, it } from "vitest";
import {
  hasRole,
  isValidRole,
  getRoleDisplayName,
  getDefaultRole,
  ROLE_HIERARCHY,
} from "./roles";

describe("hasRole", () => {
  it("grants access when current role exceeds required role", () => {
    expect(hasRole("admin", "employee")).toBe(true);
    expect(hasRole("admin", "trainer")).toBe(true);
    expect(hasRole("employee", "trainer")).toBe(true);
  });

  it("grants access when current role equals required role", () => {
    expect(hasRole("admin", "admin")).toBe(true);
    expect(hasRole("employee", "employee")).toBe(true);
    expect(hasRole("trainer", "trainer")).toBe(true);
  });

  it("denies access when current role is below required role", () => {
    expect(hasRole("trainer", "admin")).toBe(false);
    expect(hasRole("trainer", "employee")).toBe(false);
    expect(hasRole("employee", "admin")).toBe(false);
  });

  it("denies access for a null or undefined current role", () => {
    expect(hasRole(null, "trainer")).toBe(false);
    expect(hasRole(undefined, "trainer")).toBe(false);
  });

  it("denies access for an empty string current role", () => {
    expect(hasRole("", "trainer")).toBe(false);
  });

  it("falls back an unrecognized role string to trainer-level access only", () => {
    // An invalid/corrupted role string should never silently grant elevated
    // access - it should only satisfy the lowest-tier requirement.
    expect(hasRole("superadmin", "trainer")).toBe(true);
    expect(hasRole("superadmin", "employee")).toBe(false);
    expect(hasRole("superadmin", "admin")).toBe(false);
  });

  it("is case-sensitive and treats a mismatched case as an invalid role", () => {
    expect(hasRole("Admin", "admin")).toBe(false);
    expect(hasRole("Admin", "trainer")).toBe(true);
  });

  it("matches the documented hierarchy ordering (admin > employee > trainer)", () => {
    expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.employee);
    expect(ROLE_HIERARCHY.employee).toBeGreaterThan(ROLE_HIERARCHY.trainer);
  });
});

describe("isValidRole", () => {
  it("accepts the three known roles", () => {
    expect(isValidRole("admin")).toBe(true);
    expect(isValidRole("employee")).toBe(true);
    expect(isValidRole("trainer")).toBe(true);
  });

  it("rejects unknown role strings", () => {
    expect(isValidRole("owner")).toBe(false);
    expect(isValidRole("")).toBe(false);
  });
});

describe("getRoleDisplayName", () => {
  it("returns a human-readable name for each role", () => {
    expect(getRoleDisplayName("admin")).toBe("Administrator");
    expect(getRoleDisplayName("employee")).toBe("Employee");
    expect(getRoleDisplayName("trainer")).toBe("Trainer");
  });
});

describe("getDefaultRole", () => {
  it("defaults to the lowest-privilege role", () => {
    expect(getDefaultRole()).toBe("trainer");
  });
});

import { describe, expect, it } from "vitest";
import {
  ROLE_PRESETS,
  STAFF_PERMISSIONS,
  TRAINER_TIER_PERMISSIONS,
  allows,
  isStaffPermission,
  normalizePermissions,
  permissionsForTier,
} from "./staffPermissions";

describe("allows", () => {
  it("lets a built-in role do anything its tier offers (permissions are null)", () => {
    expect(allows(null, "billing.manage")).toBe(true);
    expect(allows(undefined, ["pos.use", "pos.manage"])).toBe(true);
  });

  it("limits a custom role to exactly its list", () => {
    const front = ["members.manage", "pos.use"];
    expect(allows(front, "members.manage")).toBe(true);
    expect(allows(front, "billing.view")).toBe(false);
    expect(allows([], "members.manage")).toBe(false);
    expect(allows(front, "nonsense")).toBe(false);
  });

  it("treats a list of permissions as any-of", () => {
    expect(allows(["pos.manage"], ["pos.use", "pos.manage"])).toBe(true);
    expect(allows(["classes.manage"], ["pos.use", "pos.manage"])).toBe(false);
    expect(allows(["pos.use"], [])).toBe(false);
  });
});

describe("normalizePermissions", () => {
  it("drops unknown entries, repeats and orders like the catalogue", () => {
    expect(normalizePermissions(["pos.use", "x", "members.manage", "pos.use"])).toEqual(["members.manage", "pos.use"]);
  });

  it("adds billing.view when billing.manage is chosen", () => {
    expect(normalizePermissions(["billing.manage"])).toEqual(["billing.view", "billing.manage"]);
  });
});

describe("catalogue", () => {
  it("has the eight permissions the database knows", () => {
    expect(STAFF_PERMISSIONS).toHaveLength(8);
    expect(isStaffPermission("members.manage")).toBe(true);
    expect(isStaffPermission("admin")).toBe(false);
    expect(isStaffPermission(5)).toBe(false);
  });

  it("offers a trainer tier only what that tier can use", () => {
    expect(permissionsForTier("trainer")).toEqual(TRAINER_TIER_PERMISSIONS);
    expect(permissionsForTier("employee")).toEqual(STAFF_PERMISSIONS);
  });

  it("presets only use real permissions, and trainer presets stay inside their tier", () => {
    for (const preset of ROLE_PRESETS) {
      for (const p of preset.permissions) expect(isStaffPermission(p)).toBe(true);
      if (preset.tier === "trainer") {
        for (const p of preset.permissions) expect(TRAINER_TIER_PERMISSIONS).toContain(p);
      }
    }
  });
});

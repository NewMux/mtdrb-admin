// What a custom staff role can be allowed to do. The list is the one in the
// database (staff_permission_catalog() in 20261026090000_custom_roles.sql); the
// database enforces it, this file only names and groups it for the screens.

export const STAFF_PERMISSIONS = [
  "members.manage",
  "billing.view",
  "billing.manage",
  "pos.use",
  "pos.manage",
  "classes.manage",
  "trainers.manage",
  "attendance.manage",
] as const;

export type StaffPermission = (typeof STAFF_PERMISSIONS)[number];

export type StaffTier = "employee" | "trainer";

/** What a trainer-level role can be given (the database refuses the rest). */
export const TRAINER_TIER_PERMISSIONS: readonly StaffPermission[] = ["classes.manage", "billing.view"];

export const permissionsForTier = (tier: StaffTier): readonly StaffPermission[] =>
  tier === "trainer" ? TRAINER_TIER_PERMISSIONS : STAFF_PERMISSIONS;

export const isStaffPermission = (value: unknown): value is StaffPermission =>
  typeof value === "string" && (STAFF_PERMISSIONS as readonly string[]).includes(value);

/** billing.manage includes billing.view, as the database stores it. */
export function normalizePermissions(list: readonly string[]): StaffPermission[] {
  const set = new Set(list.filter(isStaffPermission));
  if (set.has("billing.manage")) set.add("billing.view");
  return STAFF_PERMISSIONS.filter((p) => set.has(p));
}

/**
 * Whether a person may do something. `permissions` is null for a built-in role
 * (admin, employee, trainer): their tier decides, so everything the screens
 * offer them is fair game. For a custom role it is exactly the list.
 * `permission` may be several, meaning "any of".
 */
export function allows(
  permissions: readonly string[] | null | undefined,
  permission: string | readonly string[],
): boolean {
  if (permissions === null || permissions === undefined) return true;
  const wanted = typeof permission === "string" ? [permission] : permission;
  return wanted.some((p) => permissions.includes(p));
}

export interface RolePreset {
  id: string;
  tier: StaffTier;
  permissions: readonly StaffPermission[];
}

/** Starting points offered when creating a role. The name comes from i18n. */
export const ROLE_PRESETS: readonly RolePreset[] = [
  { id: "frontDesk", tier: "employee", permissions: ["members.manage", "attendance.manage", "pos.use"] },
  { id: "accountant", tier: "employee", permissions: ["billing.manage"] },
  { id: "manager", tier: "employee", permissions: ["members.manage", "billing.manage", "pos.use", "pos.manage", "classes.manage", "trainers.manage", "attendance.manage"] },
  { id: "coach", tier: "trainer", permissions: ["classes.manage"] },
];

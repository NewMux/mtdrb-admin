/**
 * User Role Definitions
 * 
 * Single source of truth for user roles in the MTDRB Admin application.
 * All role-related code should import and use types/functions from this file.
 */

/**
 * User role type definition
 * Hierarchy: owner > admin > manager > trainer > staff
 */
export type UserRole = "owner" | "admin" | "manager" | "trainer" | "staff";

/**
 * Array of all valid user roles (for validation)
 */
export const USER_ROLES: UserRole[] = [
  "owner",
  "admin",
  "manager",
  "trainer",
  "staff",
];

/**
 * Role hierarchy levels
 * Higher number = more permissions
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 4,
  admin: 3,
  manager: 2,
  trainer: 1,
  staff: 0,
};

/**
 * Check if a user has a required role or higher
 * 
 * @param currentRole - The user's current role
 * @param requiredRole - The minimum role required
 * @returns true if current role meets or exceeds required role
 * 
 * @example
 * hasRole("admin", "manager") // true (admin > manager)
 * hasRole("trainer", "admin") // false (trainer < admin)
 * hasRole("manager", "manager") // true (equal)
 */
export function hasRole(
  currentRole: UserRole | string | null | undefined,
  requiredRole: UserRole,
): boolean {
  if (!currentRole) return false;

  // Validate current role
  if (!USER_ROLES.includes(currentRole as UserRole)) {
    // Only warn in development to avoid leaking info in production
    if (import.meta.env.DEV) {
      console.warn(`Invalid role detected: ${currentRole}. Defaulting to staff.`);
    }
    return requiredRole === "staff";
  }

  const currentLevel = ROLE_HIERARCHY[currentRole as UserRole];
  const requiredLevel = ROLE_HIERARCHY[requiredRole];

  return currentLevel >= requiredLevel;
}

/**
 * Get the display name for a role
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    owner: "Owner",
    admin: "Administrator",
    manager: "Manager",
    trainer: "Trainer",
    staff: "Staff",
  };

  return displayNames[role] || role;
}

/**
 * Validate if a string is a valid user role
 */
export function isValidRole(role: string): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

/**
 * Get the default role (lowest permission level)
 */
export function getDefaultRole(): UserRole {
  return "staff";
}


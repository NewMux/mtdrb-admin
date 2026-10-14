/**
 * User Role Definitions
 * 
 * Single source of truth for user roles in the MTDRB Admin application.
 * All role-related code should import and use types/functions from this file.
 */

/**
 * User role type definition
 * Hierarchy: admin > employee > trainer
 */
export type UserRole = "admin" | "employee" | "trainer";

/**
 * Array of all valid user roles (for validation)
 */
export const USER_ROLES: UserRole[] = [
  "admin",
  "employee",
  "trainer",
];

/**
 * Role hierarchy levels
 * Higher number = more permissions
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 2,
  employee: 1,
  trainer: 0,
};

/**
 * Check if a user has a required role or higher
 * 
 * @param currentRole - The user's current role
 * @param requiredRole - The minimum role required
 * @returns true if current role meets or exceeds required role
 * 
 * @example
 * hasRole("admin", "employee") // true (admin > employee)
 * hasRole("trainer", "admin") // false (trainer < admin)
 * hasRole("employee", "employee") // true (equal)
 * hasRole("superadmin", "trainer") // false (unrecognized role fails closed)
 */
export function hasRole(
  currentRole: UserRole | string | null | undefined,
  requiredRole: UserRole,
): boolean {
  if (!currentRole) return false;

  // Fail closed: an unrecognized role string (corrupted, mis-cased, or a
  // role the client doesn't know about yet) grants no access at all, not
  // even trainer-level. AuthProvider already rejects invalid membership
  // roles before they reach here; this is defence in depth.
  if (!isValidRole(currentRole)) {
    // Only warn in development to avoid leaking info in production
    if (import.meta.env.DEV) {
      console.warn(`Invalid role detected: ${currentRole}. Denying access.`);
    }
    return false;
  }

  const currentLevel = ROLE_HIERARCHY[currentRole];
  const requiredLevel = ROLE_HIERARCHY[requiredRole];

  return currentLevel >= requiredLevel;
}

/**
 * Get the display name for a role
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    admin: "Administrator",
    employee: "Employee",
    trainer: "Trainer",
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
  return "trainer";
}


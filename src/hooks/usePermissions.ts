import { useAuth } from "../contexts/AuthContext";
import { hasRole, UserRole, getDefaultRole } from "../types/roles";

/**
 * Custom hook for permission checking
 * 
 * Provides easy access to permission checks and role validation
 * 
 * @example
 * ```tsx
 * const { canCreate, canEdit, canDelete, userRole } = usePermissions();
 * 
 * {canCreate && <button onClick={handleCreate}>Create</button>}
 * ```
 */
export function usePermissions() {
  const { userMetadata, hasPermission } = useAuth();

  // Get user's role (default to staff if not set)
  const userRole = (userMetadata?.role || getDefaultRole()) as UserRole;

  /**
   * Check if user has a specific role or higher
   */
  const hasRoleAccess = (requiredRole: UserRole): boolean => {
    if (!userMetadata) return false;
    return hasRole(userRole, requiredRole);
  };

  /**
   * Permission checks for common actions
   */
  const canCreate = hasPermission("write") || hasPermission("all");
  const canEdit = hasPermission("write") || hasPermission("all");
  const canDelete = hasPermission("write") || hasPermission("all");
  const canView = hasPermission("read") || hasPermission("all");
  const canManageStaff = hasPermission("manage_staff") || hasPermission("all");
  const canManageClasses = hasPermission("write_classes") || hasPermission("all");

  /**
   * Role-based access checks
   */
  const isAdmin = hasRoleAccess("admin");
  const isManager = hasRoleAccess("manager");
  const isTrainer = hasRoleAccess("trainer");
  const isStaff = hasRoleAccess("staff");
  const isOwner = hasRoleAccess("owner");

  return {
    // Role checks
    userRole,
    isOwner,
    isAdmin,
    isManager,
    isTrainer,
    isStaff,
    hasRoleAccess,

    // Permission checks
    canCreate,
    canEdit,
    canDelete,
    canView,
    canManageStaff,
    canManageClasses,
    hasPermission,
  };
}


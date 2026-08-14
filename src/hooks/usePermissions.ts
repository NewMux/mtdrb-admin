import { useAuth } from "../contexts/AuthContext";
import { hasRole, UserRole } from "../types/roles";

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

  // AuthProvider derives this role from the membership table. Fail closed
  // when that database-backed context is unavailable.
  const userRole = userMetadata?.role as UserRole | undefined;

  /**
   * Check if user has a specific role or higher
   */
  const hasRoleAccess = (requiredRole: UserRole): boolean => {
    if (!userMetadata?.tenant_id || !userRole) return false;
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
  const isEmployee = hasRoleAccess("employee");
  const isTrainer = hasRoleAccess("trainer");

  return {
    // Role checks
    userRole,
    isAdmin,
    isEmployee,
    isTrainer,
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


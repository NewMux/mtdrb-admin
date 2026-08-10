import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { hasRole, UserRole, getDefaultRole } from "../../types/roles";

interface PermissionGuardProps {
  /**
   * The content to render if user has permission
   */
  children: React.ReactNode;

  /**
   * The minimum role required to access this content
   */
  requiredRole: UserRole;

  /**
   * Optional path to redirect to if user lacks permission
   * If not provided, shows an "Unauthorized" message
   */
  fallbackPath?: string;

  /**
   * Optional custom unauthorized message component
   */
  unauthorizedComponent?: React.ReactNode;
}

/**
 * PermissionGuard Component
 * 
 * Protects routes and components by checking if the user has the required role.
 * 
 * @example
 * ```tsx
 * <PermissionGuard requiredRole="admin" fallbackPath="/dashboard">
 *   <AdminPanel />
 * </PermissionGuard>
 * ```
 * 
 * @example
 * ```tsx
 * <PermissionGuard requiredRole="employee">
 *   <EmployeeDashboard />
 * </PermissionGuard>
 * ```
 */
export default function PermissionGuard({
  children,
  requiredRole,
  fallbackPath,
  unauthorizedComponent,
}: PermissionGuardProps) {
  const { userMetadata, isLoading } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If no user metadata, user is not authenticated
  if (!userMetadata) {
    if (fallbackPath) {
      return <Navigate to={fallbackPath} replace />;
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600">
            Please sign in to access this page.
          </p>
        </div>
      </div>
    );
  }

  // Get user's role (default to trainer if not set)
  const userRole = (userMetadata.role || getDefaultRole()) as UserRole;

  // Check if user has required role
  const hasPermission = hasRole(userRole, requiredRole);

  if (!hasPermission) {
    // Redirect if fallback path is provided
    if (fallbackPath) {
      return <Navigate to={fallbackPath} replace />;
    }

    // Show custom unauthorized component if provided
    if (unauthorizedComponent) {
      return <>{unauthorizedComponent}</>;
    }

    // Default unauthorized message
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Required role: <span className="font-semibold">{requiredRole}</span>
            <br />
            Your role: <span className="font-semibold">{userRole}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // User has permission, render children
  return <>{children}</>;
}


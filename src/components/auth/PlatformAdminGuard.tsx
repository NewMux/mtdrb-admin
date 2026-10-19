import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { usePlatformAdmin } from "../../contexts/platform-admin-context";
import NotFound from "../../pages/NotFound";
import MfaGate from "./MfaGate";

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

/**
 * Gate for the platform-owner console.
 *
 * This is UX only: it decides which screen to show. The real enforcement is
 * in the database - every platform_* RPC calls require_platform_admin(), so
 * rendering the console to the wrong person would still return no data.
 *
 *   logged out    -> /login (and back here afterwards)
 *   error         -> retry screen (never the children, never a misleading 404)
 *   not_admin     -> the normal 404 page, so the console's existence is not revealed
 *   mfa_required  -> TOTP enrol / verify
 *   ok            -> children
 */
export default function PlatformAdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { state, refresh } = usePlatformAdmin();
  const location = useLocation();

  if (isLoading) return <Spinner />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  switch (state.phase) {
    case "loading":
      return <Spinner />;
    case "error":
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
          <div className="max-w-md w-full text-center bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Could not check your access
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{state.message}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    case "mfa_required":
      return <MfaGate onVerified={refresh} />;
    case "ok":
      return <>{children}</>;
    case "not_admin":
    default:
      return <NotFound />;
  }
}

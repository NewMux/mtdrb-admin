import React, { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300"
      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
  }`;

/**
 * Shell for the platform-owner console. Deliberately separate from the gym
 * Layout/Sidebar: it needs no tenant and shows nothing tenant-specific.
 * English-only on purpose (owner tool); logical utilities keep it RTL-safe.
 */
export default function SuperAdminLayout() {
  const { user, signOut } = useAuth();

  useEffect(() => {
    const previous = document.title;
    document.title = "MTDRB Platform";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <span className="whitespace-nowrap font-semibold text-gray-900 dark:text-white">
              MTDRB Platform
            </span>
            <nav className="flex gap-1" aria-label="Platform sections">
              <NavLink to="/superadmin" end className={navClass}>
                Overview
              </NavLink>
              <NavLink to="/superadmin/tenants" className={navClass}>
                Gyms
              </NavLink>
            </nav>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden max-w-[16rem] truncate text-sm text-gray-500 dark:text-gray-400 sm:block" title={user?.email ?? ""}>
              {user?.email}
            </span>
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label="Sign out"
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            >
              <FiLogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

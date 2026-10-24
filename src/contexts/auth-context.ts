import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";
import type { UserRole } from "../types/roles";

export interface AuthErrorState {
  code: string;
  message: string;
  details?: string;
}

export interface UserMetadata {
  tenant_id: string;
  paid: boolean;
  role: UserRole;
  subscription_tier: "free" | "basic" | "premium" | "enterprise";
  /**
   * What a custom role allows, or null/undefined for a built-in role (everything
   * its tier allows). Only for showing and hiding screens: the database decides
   * every read and write.
   */
  permissions?: string[] | null;
  custom_role_name?: string | null;
}

export interface AuthContextType {
  user: User | null;
  tenantId: string | null;
  isLoading: boolean;
  error: AuthErrorState | null;
  userMetadata: UserMetadata | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  /** Whether the person may do something their role limits (see config/staffPermissions.ts). Any-of for a list. */
  can: (permission: string | readonly string[]) => boolean;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

/**
 * Access the authenticated user session and auth actions.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

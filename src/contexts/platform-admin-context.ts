import { createContext, useContext } from "react";
import type { PlatformAdminStatus } from "../types/platformAdmin";

/**
 * Client-side view of platform_admin_status(). `error` is distinct from
 * `not_admin` so a network blip shows a retry screen instead of the owner
 * being told the page does not exist.
 */
export type PlatformAdminState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: PlatformAdminStatus };

export interface PlatformAdminContextValue {
  state: PlatformAdminState;
  /** Re-asks the database (e.g. after a successful MFA verification). */
  refresh: () => Promise<void>;
}

export const PlatformAdminContext = createContext<PlatformAdminContextValue | undefined>(
  undefined,
);

export function usePlatformAdmin(): PlatformAdminContextValue {
  const ctx = useContext(PlatformAdminContext);
  if (!ctx) {
    throw new Error("usePlatformAdmin must be used inside PlatformAdminProvider");
  }
  return ctx;
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { fetchPlatformAdminStatus } from "../api/platformAdmin";
import { withTimeout } from "../utils/withTimeout";
import {
  PlatformAdminContext,
  type PlatformAdminState,
} from "./platform-admin-context";

/**
 * Looks up the signed-in user's platform-admin status once per user id.
 *
 * Mounted only inside the /superadmin route element, so ordinary gym users
 * never make this call. The result drives UX (which screen to show); the
 * database re-checks on every platform_* RPC.
 */
export function PlatformAdminProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<PlatformAdminState>({ phase: "loading" });
  const requestRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestRef.current;
    if (!userId) {
      setState({ phase: "not_admin" });
      return;
    }
    setState({ phase: "loading" });
    try {
      const status = await withTimeout(
        fetchPlatformAdminStatus(),
        10_000,
        "Timed out checking your access",
      );
      // Last request wins; ignore a stale answer for a previous user.
      if (requestId === requestRef.current) setState({ phase: status });
    } catch (err) {
      if (requestId === requestRef.current) {
        setState({
          phase: "error",
          message: err instanceof Error ? err.message : "Could not check your access.",
        });
      }
    }
  }, [userId]);

  useEffect(() => {
    if (isLoading) return;
    void load();
  }, [isLoading, load]);

  const value = useMemo(() => ({ state, refresh: load }), [state, load]);

  return (
    <PlatformAdminContext.Provider value={value}>{children}</PlatformAdminContext.Provider>
  );
}

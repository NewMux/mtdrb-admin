import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/auth-context";
import { useGymConfig } from "../contexts/gym-config-context";
import { buildChecklist, type ChecklistItem } from "../utils/setupChecklist";

type CountedTable = "plans" | "members" | "classes" | "invoices";

async function count(table: CountedTable, tenantId: string): Promise<number> {
  const { count: n, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);
  if (error) throw error;
  return n ?? 0;
}

/**
 * What the gym has set up so far, from live data. `items` is null while
 * loading or if the counts can't be read - callers show nothing rather than a
 * wrong "0 of 5".
 */
export function useSetupProgress(refreshKey?: number): { items: ChecklistItem[] | null } {
  const { tenantId } = useAuth();
  const { config, loading: configLoading } = useGymConfig();
  const [counts, setCounts] = useState<{ plans: number; members: number; classes: number; invoices: number } | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    try {
      const [plans, members, classes, invoices] = await Promise.all([
        count("plans", tenantId),
        count("members", tenantId),
        count("classes", tenantId),
        count("invoices", tenantId),
      ]);
      setCounts({ plans, members, classes, invoices });
    } catch {
      setCounts(null);
    }
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  if (!counts || configLoading) return { items: null };
  return { items: buildChecklist({ configured: config.configured, ...counts }) };
}

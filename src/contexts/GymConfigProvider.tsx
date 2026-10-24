import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./auth-context";
import { fetchGymSettings, saveGymSettings, type GymSettings } from "../api/settings";
import {
  buildSettingsWrite,
  resolveGymConfig,
  validateGymConfig,
  type GymConfigInput,
} from "../config/gymConfig";
import {
  GymConfigContext,
  PLATFORM_CONFIG_DEFAULTS,
  type GymConfigContextType,
  type SaveGymConfigResult,
} from "./gym-config-context";

export function GymConfigProvider({ children }: { children: React.ReactNode }) {
  const { tenantId } = useAuth();
  const [row, setRow] = useState<GymSettings | null>(null);
  const [loading, setLoading] = useState(true);
  // The tenant the current `row` belongs to, so a stale response from the
  // previous gym can never land after a switch.
  const loadedFor = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) {
      loadedFor.current = null;
      setRow(null);
      setLoading(false);
      return;
    }
    const requested = tenantId;
    loadedFor.current = requested;
    const { data } = await fetchGymSettings(requested);
    if (loadedFor.current !== requested) return;
    setRow(data);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  const save = useCallback(
    async (input: GymConfigInput): Promise<SaveGymConfigResult> => {
      if (!tenantId) return { ok: false, message: "No gym is loaded" };

      const errors = validateGymConfig(input);
      if (Object.keys(errors).length > 0) return { ok: false, errors };

      // Merge into what is stored NOW, not what this tab loaded earlier, so a
      // save never drops keys another tab or the Settings page wrote meanwhile.
      const { data: current, error: readError } = await fetchGymSettings(tenantId);
      if (readError) return { ok: false, message: readError.message };

      const write = buildSettingsWrite(input, current?.metadata, new Date());
      const { data, error } = await saveGymSettings({ tenant_id: tenantId, ...write });
      if (error || !data) return { ok: false, message: error?.message ?? "Failed to save" };

      setRow(data);
      return { ok: true };
    },
    [tenantId],
  );

  const config = useMemo(() => resolveGymConfig(row, PLATFORM_CONFIG_DEFAULTS), [row]);

  const value = useMemo<GymConfigContextType>(
    () => ({ config, loading, refresh: load, save }),
    [config, loading, load, save],
  );

  return <GymConfigContext.Provider value={value}>{children}</GymConfigContext.Provider>;
}

// The endpoint readers, turnstile controllers and gateways call to report a scan
// and learn whether to open. See handler.ts for the request/response format, and
// DEPLOYMENT.md ("Door and reader integration") for setup.
//
// Deployed with verify_jwt = false (supabase/config.toml): a device has no Supabase
// session. It authenticates with its own key (mtdrb_dev_...), created by a gym
// admin in Attendance -> Devices; only the key's hash is stored.
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.

import { createClient } from "npm:@supabase/supabase-js@2";
import { handleIngest, type IngestDeps, type ScanOutcome, type ScanParams } from "./handler.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const deps: IngestDeps = {
  async scan(params: ScanParams): Promise<ScanOutcome> {
    const { data, error } = await adminClient.rpc("attendance_device_scan", {
      p_key_hash: params.keyHash,
      p_credential_type: params.credentialType,
      p_credential: params.credential,
      p_direction: params.direction,
      p_external_event_id: params.eventId,
      p_occurred_at: params.occurredAt,
    });
    if (error) {
      // 28000 bad key, 55000 inactive device, 22023 bad input: the caller can act
      // on these; anything else is an internal failure.
      if (["28000", "55000", "22023"].includes(error.code ?? "")) {
        return { ok: false, code: error.code ?? "", message: error.message };
      }
      throw new Error(error.message);
    }
    return { ok: true, result: (data ?? {}) as Record<string, unknown> };
  },

  async rateLimit(key) {
    const { data, error } = await adminClient.rpc("check_rate_limit", {
      p_key: key,
      p_max_count: 120,
      p_window_seconds: 60,
    });
    if (error) throw error;
    return data !== false;
  },

  log: (message, detail) => console.error(`attendance-ingest: ${message}`, detail ?? ""),
};

Deno.serve(async (req) => {
  const result = await handleIngest(
    {
      method: req.method,
      authorization: req.headers.get("Authorization"),
      deviceKeyHeader: req.headers.get("X-Device-Key"),
      bodyText: req.method === "POST" ? await req.text() : "",
    },
    deps,
  );
  return new Response(result.body, { status: result.status, headers: result.headers });
});

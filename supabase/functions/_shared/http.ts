// Small request/response helpers shared by the browser-facing Edge Functions
// (paddle-manage-locations, paddle-cancel-subscription). Kept free of Deno and
// Supabase imports so handlers stay unit-testable.

export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  /** JSON string, or null for an empty response. */
  body: string | null;
}

/** CORS headers for an origin on the allow-list; none for anyone else. */
export function corsHeaders(origin: string | null, allowed: string[]): Record<string, string> {
  if (!origin || !allowed.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info, x-application-name, prefer",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "600",
  };
}

export function reply(status: number, cors: Record<string, string>, payload?: unknown): HttpResponse {
  return {
    status,
    headers: { ...cors, ...(payload === undefined ? {} : { "Content-Type": "application/json" }) },
    body: payload === undefined ? null : JSON.stringify(payload),
  };
}

/** The token from "Authorization: Bearer <token>", or null. */
export function bearerToken(authorization: string | null): string | null {
  return /^Bearer\s+(\S+)$/i.exec(authorization ?? "")?.[1] ?? null;
}

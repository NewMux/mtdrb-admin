// Shared CORS handling for browser-callable Edge Functions.
//
// ALLOWED_ORIGINS is a comma-separated allowlist (e.g. the app's production
// URL plus any preview/self-hosted domains) - there is no sane default, an
// unset value allows nothing rather than falling back to a wildcard.
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export function corsHeaders(requestOrigin: string | null): HeadersInit {
  const allowOrigin =
    requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : "null";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

export function jsonResponse(
  body: unknown,
  status: number,
  requestOrigin: string | null,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(requestOrigin), "Content-Type": "application/json" },
  });
}

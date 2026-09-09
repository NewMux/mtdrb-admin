export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  // Without this, a preflighted request's OPTIONS response returns 200 but
  // the browser still blocks the follow-up POST -- confirmed live: the
  // credimax-checkout logs showed repeated "OPTIONS | 200" with no POST
  // ever reaching the function, matching supabase-js's client-side
  // "Failed to send a request to the Edge Function" error exactly.
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-1.5-flash";
const ALLOWED_MODELS = new Set([
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash",
]);
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOTAL_INPUT = 24000;
const MAX_SYSTEM_INSTRUCTION = 6000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const requestBuckets = new Map<string, { startedAt: number; count: number }>();

const isRateLimited = (key: string): boolean => {
  const now = Date.now();
  const bucket = requestBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= RATE_LIMIT_WINDOW_MS) {
    requestBuckets.set(key, { startedAt: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
};

const json = (body: unknown, status = 200, origin?: string) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": origin || "null",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      Vary: "Origin",
    },
  });

const getAllowedOrigin = (request: Request): string | undefined => {
  const requestOrigin = request.headers.get("origin");
  const configuredOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!requestOrigin) return configuredOrigins[0];
  return configuredOrigins.includes(requestOrigin) ? requestOrigin : undefined;
};

const normalizeMessages = (messages: unknown) => {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    throw new Error("Invalid message history");
  }

  const normalized = messages.map((message) => {
    if (!message || typeof message !== "object") throw new Error("Invalid message");
    const role = (message as { role?: unknown }).role;
    const text = (message as { text?: unknown }).text;
    if ((role !== "user" && role !== "assistant" && role !== "model") || typeof text !== "string") {
      throw new Error("Invalid message");
    }
    const normalizedText = text.trim();
    if (!normalizedText || normalizedText.length > MAX_MESSAGE_LENGTH) {
      throw new Error("Message is empty or too long");
    }
    return {
      role: role === "assistant" ? "model" : "user",
      parts: [{ text: normalizedText }],
    };
  });

  const totalLength = normalized.reduce((sum, message) => sum + message.parts[0].text.length, 0);
  if (totalLength > MAX_TOTAL_INPUT) throw new Error("Message history is too long");
  return normalized;
};

Deno.serve(async (request) => {
  const origin = getAllowedOrigin(request);
  if (request.method === "OPTIONS") {
    return origin ? json({ ok: true }, 200, origin) : new Response("Forbidden", { status: 403 });
  }
  if (request.method !== "POST") {
    return origin ? json({ error: "Method not allowed" }, 405, origin) : new Response("Forbidden", { status: 403 });
  }
  if (!origin) return new Response("Forbidden", { status: 403 });

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "Authentication required" }, 401, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  if (!supabaseUrl || !supabaseAnonKey || !geminiApiKey) {
    return json({ error: "AI service is not configured" }, 503, origin);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: "Authentication required" }, 401, origin);
  }

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("tenant_id, role")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    return json({ error: "Organization membership required" }, 403, origin);
  }

  if (isRateLimited(`${membership.tenant_id}:${userData.user.id}`)) {
    return json({ error: "AI request rate limit exceeded" }, 429, origin);
  }

  let body: {
    messages?: unknown;
    systemInstruction?: unknown;
    modelName?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400, origin);
  }

  const modelName = typeof body.modelName === "string" && ALLOWED_MODELS.has(body.modelName)
    ? body.modelName
    : DEFAULT_MODEL;
  const systemInstruction = typeof body.systemInstruction === "string"
    ? body.systemInstruction.trim().slice(0, MAX_SYSTEM_INSTRUCTION)
    : "You are a concise and professional gym operations assistant. Do not invent facts.";

  try {
    const contents = normalizeMessages(body.messages);
    const response = await fetch(
      `${GEMINI_API_URL}/${modelName}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.3,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
          },
        }),
      },
    );

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("Gemini provider error", {
        status: response.status,
        userId: userData.user.id,
        tenantId: membership.tenant_id,
      });
      return json({ error: "AI provider request failed" }, 502, origin);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) {
      return json({ error: "AI provider returned an empty response" }, 502, origin);
    }

    return json({ text }, 200, origin);
  } catch (error) {
    console.error("Gemini function error", {
      message: error instanceof Error ? error.message : "Unknown error",
      userId: userData.user.id,
      tenantId: membership.tenant_id,
    });
    return json({ error: "AI request could not be completed" }, 500, origin);
  }
});

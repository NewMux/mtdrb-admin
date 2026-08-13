import { supabase } from "../supabaseClient";

export interface ChatMessage {
  role: "user" | "model" | "assistant";
  text: string;
}

interface GeminiResponse {
  text?: string;
  error?: string;
}

const DEFAULT_MODEL = "gemini-1.5-flash";

/**
 * AI requests are proxied through Supabase so the provider secret never ships
 * in the Vite bundle. The Edge Function performs authentication, tenant
 * membership checks, input limits, model allowlisting, and provider access.
 */
async function requestGemini(
  messages: ChatMessage[],
  systemInstruction?: string,
  modelName: string = DEFAULT_MODEL,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke<GeminiResponse>(
    "gemini-chat",
    {
      body: { messages, systemInstruction, modelName },
    },
  );

  if (error) {
    throw new Error("AI request could not be completed");
  }

  if (!data?.text) {
    throw new Error(data?.error || "AI provider returned an empty response");
  }

  return data.text;
}

/**
 * Compatibility wrapper for the existing streaming UI. The server response is
 * intentionally returned as one bounded chunk until true server streaming is
 * added; the provider key and tenant authorization remain server-side.
 */
export async function* streamGeminiResponse(
  messages: ChatMessage[],
  systemInstruction?: string,
  modelName: string = DEFAULT_MODEL,
): AsyncGenerator<string, void, unknown> {
  yield await requestGemini(messages, systemInstruction, modelName);
}

export async function generateGeminiResponse(
  messages: ChatMessage[],
  systemInstruction?: string,
  modelName: string = DEFAULT_MODEL,
): Promise<string> {
  return requestGemini(messages, systemInstruction, modelName);
}

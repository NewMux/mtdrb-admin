/**
 * Gemini Service
 * Handles communication with the Google Gemini API directly from the browser.
 */

export interface ChatMessage {
  role: "user" | "model" | "assistant";
  text: string;
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-1.5-flash";

/**
 * Gets the Gemini API key from environment variables
 */
export function getGeminiApiKey(): string | null {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!envKey) return null;
  // Clean potential whitespace or quotes
  return envKey.trim().replace(/^["']|["']$/g, "");
}

/**
 * Formats the chat message history to Gemini API format.
 * Roles in Gemini must be exactly "user" or "model".
 */
function formatMessagesForGemini(messages: ChatMessage[]) {
  return messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.text }],
  }));
}

interface GeminiRequestPayload {
  contents: ReturnType<typeof formatMessagesForGemini>;
  systemInstruction?: { parts: { text: string }[] };
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  };
}

/**
 * Stream responses from Gemini API using fetch and Server-Sent Events (SSE).
 * Yields chunk texts as they arrive.
 */
export async function* streamGeminiResponse(
  messages: ChatMessage[],
  systemInstruction?: string,
  modelName: string = DEFAULT_MODEL
): AsyncGenerator<string, void, unknown> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not configured. Please add it to your .env file.");
  }

  const url = `${GEMINI_API_URL}/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`;
  const formattedContents = formatMessagesForGemini(messages);

  const payload: GeminiRequestPayload = {
    contents: formattedContents,
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  // Optimize safety and settings for gym management assistant
  payload.generationConfig = {
    temperature: 0.3,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 2048,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorText = "";
    try {
      const errorJson = await response.json();
      errorText = errorJson.error?.message || response.statusText;
    } catch {
      errorText = await response.text();
    }
    throw new Error(`Gemini API Error: ${errorText || response.statusText}`);
  }

  if (!response.body) {
    throw new Error("No response body received from Gemini API");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const textChunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textChunk) {
              yield textChunk;
            }
          } catch (e) {
            console.error("Error parsing Gemini stream chunk:", e, trimmed);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Non-streaming content generation fallback
 */
export async function generateGeminiResponse(
  messages: ChatMessage[],
  systemInstruction?: string,
  modelName: string = DEFAULT_MODEL
): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY is not configured. Please add it to your .env file.");
  }

  const url = `${GEMINI_API_URL}/${modelName}:generateContent?key=${apiKey}`;
  const formattedContents = formatMessagesForGemini(messages);

  const payload: GeminiRequestPayload = {
    contents: formattedContents,
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  payload.generationConfig = {
    temperature: 0.3,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorText = "";
    try {
      const errorJson = await response.json();
      errorText = errorJson.error?.message || response.statusText;
    } catch {
      errorText = await response.text();
    }
    throw new Error(`Gemini API Error: ${errorText}`);
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!responseText) {
    throw new Error("Invalid or empty response from Gemini API");
  }

  return responseText;
}

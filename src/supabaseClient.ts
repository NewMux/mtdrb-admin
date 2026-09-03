import { createClient, User } from "@supabase/supabase-js";
import { Database } from "./types/supabase";
import { createMockSupabaseClient } from "./mocks/mockSupabaseClient";

// Whether to use the credential-free in-memory mock backend instead of a
// real Supabase connection. This MUST be a build-time constant derived from
// import.meta.env.DEV, never a runtime check like the requesting hostname:
// import.meta.env.DEV is statically false in every production build, which
// makes the mock branch below provably dead code in production regardless
// of what host the built bundle happens to be served from (a self-hosted
// deployment on a private IP or a *.local domain included). A hostname
// check does not have that property - it can flip to "true" for a real
// production build simply because of how someone reaches it on the
// network, silently swapping the real backend for a fake always-admin
// session with no login. VITE_FORCE_REAL_CLIENT stays available so a
// developer can opt out of the mock and exercise a real backend from
// localhost.
export const IS_MOCK_MODE =
  import.meta.env.DEV && import.meta.env.VITE_FORCE_REAL_CLIENT !== "true";

// Helper to clean environment variables (remove newlines, carriage returns, and trim)
const cleanEnvVar = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  return value.trim().replace(/\n/g, "").replace(/\r/g, "");
};

// Clean environment variables to remove any newlines or whitespace issues
const supabaseUrl = cleanEnvVar(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = cleanEnvVar(import.meta.env.VITE_SUPABASE_ANON_KEY);

/**
 * Validate environment variables
 * 
 * CRITICAL: In production, these variables MUST be set or the application
 * will fail to start. This prevents silent failures and connection to wrong backends.
 */
function validateEnvironmentVariables(): void {
  const missingVars: string[] = [];

  if (!supabaseUrl || supabaseUrl.trim() === "") {
    missingVars.push("VITE_SUPABASE_URL");
  }

  if (!supabaseAnonKey || supabaseAnonKey.trim() === "") {
    missingVars.push("VITE_SUPABASE_ANON_KEY");
  }

  // In production, throw hard error if variables are missing
  if (!import.meta.env.DEV && missingVars.length > 0) {
    const errorMessage = `
╔════════════════════════════════════════════════════════════════╗
║  CRITICAL: Missing Required Environment Variables              ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  The following environment variables are required but missing: ║
║                                                                ║
${missingVars.map((v) => `║    • ${v.padEnd(55)} ║`).join("\n")}
║                                                                ║
║  Please set these variables in your:                           ║
║    1. .env file (for local development)                        ║
║    2. Hosting platform environment settings (for production)   ║
║                                                                ║
║  Example .env file:                                            ║
║    VITE_SUPABASE_URL=https://your-project.supabase.co         ║
║    VITE_SUPABASE_ANON_KEY=your-anon-key-here                  ║
║                                                                ║
║  The application cannot start without these variables.        ║
╚════════════════════════════════════════════════════════════════╝
    `.trim();

    console.error(errorMessage);
    throw new Error(
      `CRITICAL: Missing required environment variables: ${missingVars.join(", ")}. The application cannot start.`
    );
  }

  // In development, warn but don't throw
  if (import.meta.env.DEV && missingVars.length > 0) {
    console.warn(
      `⚠️  Warning: Missing environment variables: ${missingVars.join(", ")}. The application may not work correctly.`
    );
  }

  // Validate URL format if provided
  if (supabaseUrl && !supabaseUrl.startsWith("http")) {
    console.warn(
      `⚠️  Warning: VITE_SUPABASE_URL does not appear to be a valid URL: ${supabaseUrl}`
    );
  }
}

// Validate environment variables before initializing client
validateEnvironmentVariables();

// In mock mode, use hardcoded demo data instead of the real backend. This
// must stay lazy: constructing the real client eagerly (even when it's
// about to be discarded in favor of the mock one) throws on missing env
// vars and crashes the whole app before the mock-mode bypass ever runs -
// defeating the point of having a credential-free local dev mode at all.
export const supabase = (
  IS_MOCK_MODE
    ? createMockSupabaseClient()
    : createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          persistSession: true,
          detectSessionInUrl: true,
          autoRefreshToken: true,
        },
        global: {
          headers: {
            "x-application-name": "mtdrb-admin",
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
          },
        },
      })
) as ReturnType<typeof createClient<Database>>;

// Health check function (skipped in frontend-only mock mode)
export const checkSupabaseHealth = async (): Promise<boolean> => {
  if (IS_MOCK_MODE) return true;

  try {
    const { error } = await supabase.from("tenants").select("id").limit(1);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Supabase health check failed:", error);
    return false;
  }
};

// Auth helper
export const getCurrentUser = async (): Promise<{
  user: User | null;
  error: Error | null;
}> => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
};

// Debug mode helper
if (import.meta.env.DEV) {
  window.supabase = supabase;
}

import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { Database } from "./types/supabase";

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

export const supabase = createClient<Database>(
  supabaseUrl!,
  supabaseAnonKey!,
  {
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
  },
);

// Health check function
export const checkSupabaseHealth = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("tenants")
      .select("id")
      .limit(1);
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
  (window as any).supabase = supabase;
}

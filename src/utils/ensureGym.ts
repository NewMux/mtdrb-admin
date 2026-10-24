import { withTimeout } from "./withTimeout";

/** The few supabase-js calls ensureGym needs, so tests can supply a stub. */
export interface GymSetupClient {
  from(table: "memberships"): {
    select(columns: string): {
      eq(column: string, value: string): {
        order(column: string, opts: { ascending: boolean }): {
          limit(n: number): { maybeSingle(): PromiseLike<{ data: { tenant_id: string } | null; error: { message: string } | null }> };
        };
      };
    };
  };
  rpc(
    fn: "create_tenant_with_membership",
    args: { p_tenant_name: string; p_user_role: "admin"; p_tenant_metadata: Record<string, never> },
  ): PromiseLike<{ data: string | null; error: { message: string } | null }>;
}

export interface GymSetupUser {
  id: string;
  user_metadata?: Record<string, unknown> | null;
}

export const DEFAULT_GYM_NAME = "My Gym";

/** The gym name captured on the signup form, trimmed, or a placeholder. */
export function gymNameFor(user: GymSetupUser): string {
  const raw = user.user_metadata?.gym_name;
  return typeof raw === "string" && raw.trim() ? raw.trim().slice(0, 120) : DEFAULT_GYM_NAME;
}

/**
 * True for an account created through the signup form, which records the gym
 * name it asked for. Only those are sent to /welcome to get a gym: the platform
 * owner's login and invited admins have none (or already have a gym) and must
 * not have one created for them just by signing in.
 */
export function hasSignupGymName(user: GymSetupUser): boolean {
  const raw = user.user_metadata?.gym_name;
  return typeof raw === "string" && raw.trim().length > 0;
}

/**
 * Makes sure the signed-in user has a gym (tenant + admin membership) and
 * returns its id. Safe to call repeatedly: an existing membership is reused, so
 * a retry after a half-finished attempt - or a second tab - never creates a
 * duplicate gym. The database also allows one tenant per user.
 *
 * Signup used to create the gym inline, which only works when the signup
 * response already carries a session. With email confirmation on (the right
 * setting for a public product) the user comes back later from the email link,
 * so the same step has to be runnable from there.
 */
export async function ensureGym(client: GymSetupClient, user: GymSetupUser): Promise<string> {
  const { data: existing, error: lookupError } = await withTimeout(
    Promise.resolve(
      client
        .from("memberships")
        .select("tenant_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ),
    10000,
    "Checking your account is taking longer than expected. Please try again.",
  );
  if (lookupError) throw new Error(lookupError.message || "Could not check your account");
  if (existing?.tenant_id) return existing.tenant_id;

  const { data: tenantId, error } = await withTimeout(
    Promise.resolve(
      client.rpc("create_tenant_with_membership", {
        p_tenant_name: gymNameFor(user),
        p_user_role: "admin",
        p_tenant_metadata: {},
      }),
    ),
    15000,
    "Setting up your gym is taking longer than expected. Please check your connection and try again.",
  );
  if (error) throw new Error(error.message || "Failed to create organization");
  if (!tenantId) throw new Error("Failed to create organization: No tenant ID returned");
  return tenantId;
}

/**
 * Pages a signed-in user with no gym may stay on without being sent to
 * /welcome: the auth pages themselves, /welcome, and the legal pages.
 */
const NO_GYM_ALLOWED_PATHS = [
  "/",
  "/login",
  "/signup",
  "/welcome",
  "/reset-password",
  "/forgot-password",
  "/terms",
  "/privacy",
  "/refund",
];

export function needsGymSetupRedirect(pathname: string): boolean {
  return !NO_GYM_ALLOWED_PATHS.includes(pathname);
}

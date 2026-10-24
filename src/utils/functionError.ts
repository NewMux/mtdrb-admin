// Turns the error a failed supabase.functions.invoke() call returns into a
// message safe to show. Our Edge Functions answer failures with
// { error: "<user-safe sentence>" }; supabase-js hands that response back on
// error.context, so read it before falling back to a generic line.

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export async function functionErrorMessage(
  error: unknown,
  messages: { notDeployed: string; unreachable: string },
): Promise<string> {
  const ctx = (error as { context?: { status?: number; json?: () => Promise<unknown> } } | null)?.context;
  if (ctx?.json) {
    try {
      const body = await ctx.json();
      if (isRecord(body) && typeof body.error === "string") return body.error;
    } catch {
      // fall through to the generic messages
    }
  }
  if (ctx?.status === 404) return messages.notDeployed;
  return messages.unreachable;
}

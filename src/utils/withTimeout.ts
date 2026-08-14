/**
 * Races a promise against a timeout so a stalled network/SDK call (e.g. a
 * supabase-js auth call stuck behind an internal lock) can't leave callers
 * awaiting it forever with no way to recover.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

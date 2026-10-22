// Client side of erasing an account (supabase/functions/delete-account). The
// Edge Function cancels any live subscription, deletes the data and accounts in
// one database transaction, and removes uploaded files.

import { supabase } from "../supabaseClient";
import { functionErrorMessage } from "../utils/functionError";

export type DeleteScope = "gym" | "me";

export interface DeleteResult {
  deletedUsers: number;
  /** false if some uploaded files could not be removed (the data itself is gone) */
  filesRemoved: boolean;
  subscriptionCancelled: boolean;
}

export class AccountDeletionError extends Error {}

type FunctionsClient = {
  functions: {
    invoke: (name: string, options: { body: unknown }) => Promise<{ data: unknown; error: unknown }>;
  };
};

/**
 * Deletes the signed-in person's gym ("gym", admins only) or just their own
 * account ("me"). `confirm` is the exact gym name or the account email.
 */
export async function deleteAccount(scope: DeleteScope, confirm: string): Promise<DeleteResult> {
  const { data, error } = await (supabase as unknown as FunctionsClient).functions.invoke("delete-account", {
    body: { scope, confirm },
  });
  if (error) {
    throw new AccountDeletionError(
      await functionErrorMessage(error, {
        notDeployed: "Account deletion isn't available yet. Contact support.",
        unreachable: "Could not reach the server. Nothing was deleted. Try again.",
      }),
    );
  }

  const body = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : null;
  if (!body || body.deleted !== true) {
    throw new AccountDeletionError("The server returned an unexpected answer. Refresh and check whether your account still exists.");
  }
  return {
    deletedUsers: typeof body.deleted_users === "number" ? body.deleted_users : 1,
    filesRemoved: body.files_removed !== false,
    subscriptionCancelled: body.subscription_cancelled === true,
  };
}

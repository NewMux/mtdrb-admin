// Everything a gym uploads lives under "<folder>/<tenant id>/..." in one of
// these private/public buckets (see the upload calls in src/ and the storage
// policies in supabase/migrations). Deleting a gym must remove those files too:
// they hold invoices, receipts, ID documents and photos.
//
// Kept free of Deno and Supabase imports: the storage client is passed in, so
// the walking logic is unit-testable.

export const TENANT_STORAGE_FOLDERS: ReadonlyArray<{ bucket: string; folder: string }> = [
  { bucket: "expense-receipts", folder: "receipts" },
  { bucket: "invoice-files", folder: "invoices" },
  { bucket: "task-attachments", folder: "attachments" },
  { bucket: "gym-logos", folder: "logos" },
  { bucket: "profile-pictures", folder: "profile-pictures" },
  { bucket: "trainer-documents", folder: "documents" },
];

export interface StorageEntry {
  name: string;
  /** Folders come back without an id */
  id: string | null;
}

export interface StorageBucketApi {
  list(path: string, options: { limit: number; offset: number }): Promise<{ data: StorageEntry[] | null; error: { message: string } | null }>;
  remove(paths: string[]): Promise<{ error: { message: string } | null }>;
}

export interface StorageApi {
  from(bucket: string): StorageBucketApi;
}

const PAGE = 1000;
const REMOVE_CHUNK = 100;
const MAX_DEPTH = 8;

/** Every file path under `prefix`, walking sub-folders. */
async function listFiles(bucket: StorageBucketApi, prefix: string, depth = 0): Promise<string[]> {
  if (depth > MAX_DEPTH) throw new Error(`storage tree under ${prefix} is deeper than expected`);
  const files: string[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await bucket.list(prefix, { limit: PAGE, offset });
    if (error) throw new Error(error.message);
    const entries = data ?? [];
    for (const entry of entries) {
      const path = `${prefix}/${entry.name}`;
      if (entry.id === null) files.push(...(await listFiles(bucket, path, depth + 1)));
      else files.push(path);
    }
    if (entries.length < PAGE) break;
  }
  return files;
}

export interface RemovalResult {
  removed: number;
  /** Buckets that could not be fully cleaned, with the reason */
  failures: { bucket: string; message: string }[];
}

/** Removes every file the gym uploaded. A bucket that fails does not stop the others. */
export async function removeTenantFiles(storage: StorageApi, tenantId: string): Promise<RemovalResult> {
  let removed = 0;
  const failures: RemovalResult["failures"] = [];

  for (const { bucket, folder } of TENANT_STORAGE_FOLDERS) {
    try {
      const api = storage.from(bucket);
      const files = await listFiles(api, `${folder}/${tenantId}`);
      for (let i = 0; i < files.length; i += REMOVE_CHUNK) {
        const chunk = files.slice(i, i + REMOVE_CHUNK);
        const { error } = await api.remove(chunk);
        if (error) throw new Error(error.message);
        removed += chunk.length;
      }
    } catch (err) {
      failures.push({ bucket, message: err instanceof Error ? err.message : "failed" });
    }
  }
  return { removed, failures };
}

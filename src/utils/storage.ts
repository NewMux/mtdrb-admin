import { supabase } from "../supabaseClient";

const getStoredObjectPath = (value: string, bucket: string): string | null => {
  const marker = `/storage/v1/object/public/${bucket}/`;
  if (value.startsWith(marker)) {
    return decodeURIComponent(value.slice(marker.length));
  }

  // New records store the object path directly. Reject arbitrary external
  // URLs so a database value cannot redirect users to an uncontrolled origin.
  if (!value.includes("://") && !value.startsWith("/")) {
    return value;
  }

  return null;
};

export async function createPrivateStorageUrl(
  bucket: "expense-receipts" | "invoice-files",
  value: string | null | undefined,
  expiresInSeconds = 300,
): Promise<string | null> {
  if (!value) return null;

  const path = getStoredObjectPath(value, bucket);
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    console.error("Unable to create private storage URL:", error);
    return null;
  }

  return data.signedUrl;
}

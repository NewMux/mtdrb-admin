import { supabase } from "../supabaseClient";
import { Member } from "../types/member";

/**
 * Fetch all members for the current tenant (for staff waitlist search)
 */
export async function getAllMembers(tenantId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("first_name", { ascending: true })
    .order("last_name", { ascending: true });
  if (error) throw error;
  return data || [];
}

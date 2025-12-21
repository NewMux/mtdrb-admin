import { supabase } from "../supabaseClient";

/**
 * Get the waitlist for a class
 */
export async function getClassWaitlist(classId: string) {
  const { data, error } = await supabase
    .from("class_waitlist")
    .select("id, member_id, created_at, status, members(first_name, last_name, email, phone)")
    .eq("class_id", classId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((w: any) => ({
    id: w.id,
    memberId: w.member_id,
    name: w.members 
      ? `${w.members.first_name || ''} ${w.members.last_name || ''}`.trim() 
      : "",
    contact: w.members?.phone || w.members?.email || "",
    addedAt: w.created_at,
    status: w.status,
  }));
}

/**
 * Add a member to the waitlist for a class
 */
export async function addToWaitlist(classId: string, memberId: string) {
  const { data, error } = await supabase
    .from("class_waitlist")
    .insert([{ class_id: classId, member_id: memberId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Remove a member from the waitlist (by waitlist row id)
 */
export async function removeFromWaitlist(waitlistId: string) {
  const { error } = await supabase
    .from("class_waitlist")
    .delete()
    .eq("id", waitlistId);
  if (error) throw error;
}

/**
 * Promote a member from waitlist to class (remove from waitlist, add to class_bookings)
 */
export async function promoteFromWaitlist(classId: string, memberId: string) {
  // Remove from waitlist
  const { data: waitlistRows, error: fetchError } = await supabase
    .from("class_waitlist")
    .select("id")
    .eq("class_id", classId)
    .eq("member_id", memberId)
    .limit(1);
  if (fetchError) throw fetchError;
  if (waitlistRows && waitlistRows.length > 0) {
    const waitlistId = waitlistRows[0].id;
    await removeFromWaitlist(waitlistId);
  }
  // Add to class_bookings
  const { data, error } = await supabase
    .from("class_bookings")
    .insert([{ class_id: classId, member_id: memberId, status: "booked" }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

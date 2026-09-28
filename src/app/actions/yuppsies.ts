"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Toggle a Yuppsie on a submission.
 * Returns { yuppsied: boolean, count: number } or throws.
 */
export async function toggleYuppsie(submissionId: string, intent: boolean): Promise<{ yuppsied?: boolean; count?: number; error?: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "UNAUTHENTICATED" };
  }

  let yuppsied: boolean;

  if (intent) {
    // Intent is to ADD yuppsie
    const { error: insertError } = await supabase
      .from("yuppsies")
      .insert({ user_id: user.id, submission_id: submissionId });

    if (insertError) {
      if (insertError.code === "23505") {
        // Already yuppsied (race condition or redundant request)
        yuppsied = true;
      } else {
        return { error: "INSERT_FAILED" };
      }
    } else {
      yuppsied = true;
    }
  } else {
    // Intent is to REMOVE yuppsie
    const { error: deleteError } = await supabase
      .from("yuppsies")
      .delete()
      .eq("user_id", user.id)
      .eq("submission_id", submissionId);

    if (deleteError) return { error: "DELETE_FAILED" };
    yuppsied = false;
  }

  // Return updated count
  const { count, error: countError } = await supabase
    .from("yuppsies")
    .select("*", { count: "exact", head: true })
    .eq("submission_id", submissionId);

  if (countError) return { error: "COUNT_FAILED" };

  return { yuppsied, count: count ?? 0 };
}

/**
 * Get Yuppsie state for the current user on a list of submissions.
 * Returns a Set of submission IDs the user has yuppsied.
 */
export async function getMyYuppsies(submissionIds: string[]): Promise<string[]> {
  if (submissionIds.length === 0) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("yuppsies")
    .select("submission_id")
    .eq("user_id", user.id)
    .in("submission_id", submissionIds);

  return (data || []).map((r: any) => r.submission_id);
}

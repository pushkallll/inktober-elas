"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function moderateSubmission(
  submissionId: string,
  action: "APPROVED" | "REVISION_REQUESTED" | "REJECTED" | "DELETED",
  reason?: string,
  guidelineId?: string,
  highlights?: { start: number, end: number, text: string, comment: string, guidelineId: string }[]
) {
  // 1. Authenticate the caller using standard cookie client
  const supabaseAuth = await createServerClient();
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // 2. Verify caller is a MODERATOR or ADMIN
  const { data: profile } = await supabaseAuth
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "MODERATOR" && profile.role !== "ADMIN")) {
    throw new Error("Forbidden");
  }

  if (action === "DELETED" && profile.role !== "ADMIN") {
    throw new Error("Only admins can delete published posts");
  }

  // 3. Perform the moderation action using secret key to bypass RLS
  const secretClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // Get the target submission
  const { data: submission, error: fetchError } = await secretClient
    .from("submissions")
    .select("user_id, status")
    .eq("id", submissionId)
    .single();

  if (fetchError || !submission) {
    throw new Error("Submission not found");
  }

  // Valid state transitions
  if (action === "APPROVED" && submission.status === "APPROVED") {
    throw new Error("Already approved");
  }

  // Insert moderation action
  const { data: actionResult, error: actionError } = await secretClient
    .from("moderation_actions")
    .insert([
      {
        target_submission_id: submissionId,
        target_user_id: submission.user_id,
        action: action,
        actor_id: user.id,
        reason: reason || null
      }
    ])
    .select("id")
    .single();

  if (actionError) {
    throw new Error("Failed to log moderation action");
  }

  // Insert highlights if any
  if (highlights && highlights.length > 0) {
    const feedbackItems = highlights.map(hl => ({
      submission_id: submissionId,
      action_id: actionResult.id,
      text_range: { start: hl.start, end: hl.end },
      selected_text: hl.text,
      comment: hl.comment,
      guideline_id: hl.guidelineId || guidelineId || null
    }));

    await secretClient.from("moderation_feedback").insert(feedbackItems);
  }

  // Update submission status
  const { error: updateError } = await secretClient
    .from("submissions")
    .update({ status: action })
    .eq("id", submissionId);

  if (updateError) {
    throw new Error("Failed to update submission status");
  }

  // Write audit log for safety
  await secretClient.from("audit_logs").insert([{
    actor_id: user.id,
    target_id: submissionId,
    action: `MODERATION_${action}`,
    details: { reason, guidelineId, highlightCount: highlights?.length || 0 }
  }]);

  revalidatePath("/moderation");
  revalidatePath("/moderation/[id]", "page");
  revalidatePath("/my-submissions");
  revalidatePath("/art");
  revalidatePath("/writing");
  revalidatePath("/");

  return { success: true };
}

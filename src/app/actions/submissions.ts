"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteMySubmission(submissionId: string) {
  const supabaseAuth = await createServerClient();
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const secretClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // Get the target submission
  const { data: submission, error: fetchError } = await secretClient
    .from("submissions")
    .select("user_id")
    .eq("id", submissionId)
    .single();

  if (fetchError || !submission) {
    throw new Error("Submission not found");
  }

  if (submission.user_id !== user.id) {
    throw new Error("Forbidden: You do not own this submission");
  }

  // Soft delete
  const { error: updateError } = await secretClient
    .from("submissions")
    .update({ status: "DELETED" })
    .eq("id", submissionId);

  if (updateError) {
    throw new Error("Failed to delete submission");
  }

  revalidatePath("/my-submissions");
  revalidatePath("/profile");

  return { success: true };
}

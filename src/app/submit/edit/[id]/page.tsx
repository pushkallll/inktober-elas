import { AuthGuard } from "@/components/auth/AuthGuard";
import { SubmitForm } from "../../SubmitForm";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }
  
  const { id } = await params;

  // Fetch prompts
  const { data: prompts } = await supabase
    .from("prompts")
    .select("id, day, prompt")
    .eq("active", true)
    .order("day", { ascending: true });

  // Fetch submission
  const { data: submission, error: subError } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  console.log("[edit] Reopening draft. ID:", id, "User:", user.id);
  console.log("[edit] Found submission?", !!submission, "Error:", subError?.message);
    
  if (!submission) {
    console.error("[edit] Submission not found!");
    notFound();
  }

  // Only DRAFT or REVISION_REQUESTED can be edited
  if (submission.status !== 'DRAFT' && submission.status !== 'REVISION_REQUESTED') {
    redirect("/my-submissions");
  }

  let moderationFeedback = null;
  if (submission.status === 'REVISION_REQUESTED') {
    const { data: actions } = await supabase
      .from("moderation_actions")
      .select(`
        id,
        reason,
        created_at,
        moderation_feedback (
          text_range,
          selected_text,
          comment
        )
      `)
      .eq("target_submission_id", id)
      .eq("action", "REVISION_REQUESTED")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (actions) {
      moderationFeedback = actions;
    }
  }
    
  return (
    <AuthGuard>
      <div className="w-full flex flex-col items-center min-h-screen py-12 sm:py-20 px-4 sm:px-6">
        <SubmitForm prompts={prompts || []} initialData={submission} moderationFeedback={moderationFeedback} />
      </div>
    </AuthGuard>
  );
}

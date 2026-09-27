import { AuthGuard } from "@/components/auth/AuthGuard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ModerationQueueClient } from "./ModerationQueueClient";

export const dynamic = "force-dynamic";

export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Verify caller is a MODERATOR or ADMIN
  const { data: profile } = await supabase
    .from("users")
    .select("id, role, status")
    .eq("id", user.id)
    .single();

  console.log("[moderation] Auth UID:", user.id);
  console.log("[moderation] Profile ID:", profile?.id);
  console.log("[moderation] Profile Role:", profile?.role);
  console.log("[moderation] Profile Status:", profile?.status);

  if (!profile || (profile.role !== "MODERATOR" && profile.role !== "ADMIN")) {
    redirect("/");
  }

  const sp = await searchParams;
  const status = sp.status || "PENDING_REVIEW";

  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select(`
      id,
      category,
      title,
      day,
      anonymous,
      status,
      created_at,
      users!submissions_user_id_fkey ( pen_name ),
      prompts ( prompt )
    `)
    .eq("status", status)
    .order("created_at", { ascending: true });

  // Log server-side for diagnostics (never exposes secrets to browser)
  console.log("[moderation] Submissions fetched count:", submissions?.length);
  if (submissionsError) {
    console.error("[moderation] query error:", submissionsError.message);
  }


  return (
    <AuthGuard>
      <div className="w-full">
        <ModerationQueueClient initialSubmissions={submissions || []} currentStatus={status} />
      </div>
    </AuthGuard>
  );
}

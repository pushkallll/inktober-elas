import { AuthGuard } from "@/components/auth/AuthGuard";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ModerationDetailClient } from "./ModerationDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ModerationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Verify caller is a MODERATOR or ADMIN
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "MODERATOR" && profile.role !== "ADMIN")) {
    redirect("/");
  }

  const { id } = await params;

  // Fetch the submission
  const { data: submission } = await supabase
    .from("submissions")
    .select(`
      *,
      users!submissions_user_id_fkey ( id, pen_name, status, role ),
      prompts ( prompt )
    `)
    .eq("id", id)
    .single();

  if (!submission) {
    notFound();
  }

  // Fetch active guidelines
  const { data: guidelines } = await supabase
    .from("community_guidelines")
    .select("*")
    .eq("active", true)
    .order("version", { ascending: false });

  // Fetch internal moderation history
  const { data: history } = await supabase
    .from("moderation_actions")
    .select(`
      id, action, reason, created_at,
      actor:users!moderation_actions_actor_id_fkey(pen_name)
    `)
    .eq("target_submission_id", id)
    .order("created_at", { ascending: false });

  return (
    <AuthGuard>
      <div className="w-full">
        <div className="mb-6">
          <Link href="/moderation" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Queue
          </Link>
        </div>
        <ModerationDetailClient 
          submission={submission} 
          guidelines={guidelines || []} 
          history={history || []}
        />
      </div>
    </AuthGuard>
  );
}

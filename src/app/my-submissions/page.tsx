import { AuthGuard } from "@/components/auth/AuthGuard";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format } from "date-fns";
import { Edit2, Eye, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DeleteSubmissionButton } from "./DeleteSubmissionButton";

export const dynamic = "force-dynamic";

export default async function MySubmissionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null; // AuthGuard handles redirect
  }

  const { data: submissions } = await supabase
    .from("submissions")
    .select(`
      *,
      prompts ( prompt ),
      moderation_actions ( id, action, reason, created_at ),
      moderation_feedback ( id, action_id, selected_text, comment )
    `)
    .eq("user_id", user.id)
    .neq("status", "DELETED")
    .order("created_at", { ascending: false });

  return (
    <AuthGuard>
      {/*
        PageHeader is a direct child of <main> (via AuthGuard which renders children directly).
        The -mx breakout cancels the px-4 sm:px-6 lg:px-8 on <main> so the header spans
        the full viewport width while content inside remains aligned to the page grid.
      */}
      <PageHeader
        title="My Submissions"
        subtitle="Manage your Inktober journey"
      >
        <Link
          href="/submit"
          className="bg-[#2d241e] text-[#faf8f5] px-6 py-3 rounded-[2px] font-sans uppercase tracking-[0.2em] text-[10px] hover:bg-[#1a1511] hover:-translate-y-0.5 active:translate-y-0 transition-all focus:outline-none focus:ring-2 focus:ring-[#2d241e] focus:ring-offset-2 focus:ring-offset-[#faf8f5] whitespace-nowrap"
        >
          New Submission
        </Link>
      </PageHeader>

      <div className="w-full max-w-[800px] mx-auto pb-16">
        {!submissions || submissions.length === 0 ? (
          <div className="bg-white/40 border border-foreground/10 p-12 text-center rounded-[2px]">
            <p className="text-foreground/60 font-serif text-lg">You haven&apos;t submitted anything yet.</p>
            <p className="text-xs text-muted uppercase tracking-wider mt-4">Start your Inktober journey today.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {submissions.map((sub: any) => {
              const actions = sub.moderation_actions?.sort((a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
              const latestFeedback = actions && actions.length > 0 ? actions[0] : null;
              const latestHighlights = latestFeedback
                ? (sub.moderation_feedback?.filter((f: any) => f.action_id === latestFeedback.id) || [])
                : [];

              return (
                <div
                  key={sub.id}
                  className="bg-[#f8f5f0]/95 backdrop-blur-[2px] border border-foreground/10 p-6 rounded-[2px] shadow-sm flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between"
                >
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded-[2px] font-bold ${
                        sub.status === "APPROVED" ? "bg-green-500/10 text-green-700" :
                        sub.status === "PENDING_REVIEW" ? "bg-yellow-500/10 text-yellow-700" :
                        sub.status === "REVISION_REQUESTED" ? "bg-orange-500/10 text-orange-700" :
                        sub.status === "REJECTED" ? "bg-red-500/10 text-red-700" :
                        sub.status === "DRAFT" ? "bg-foreground/5 text-foreground/70" :
                        "bg-gray-500/10 text-gray-700"
                      }`}>
                        {sub.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-muted uppercase tracking-wider">
                        Day {sub.day} · {sub.prompts?.prompt}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg text-foreground mb-1">{sub.title}</h3>

                    <div className="text-[10px] sm:text-xs text-muted uppercase tracking-widest flex flex-wrap items-center gap-2">
                      <span>{sub.category}{sub.genre ? ` · ${sub.genre}` : ""}</span>
                      <span>·</span>
                      <span>{format(new Date(sub.created_at), "MMM d, yyyy")}</span>
                      {sub.anonymous && (
                        <>
                          <span>·</span>
                          <span className="text-foreground/50">Anonymous</span>
                        </>
                      )}
                    </div>

                    {latestFeedback && (sub.status === "REVISION_REQUESTED" || sub.status === "REJECTED") && (
                      <div className="mt-4 bg-orange-500/5 border border-orange-500/20 p-4 rounded-[2px]">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-orange-800 mb-2">Moderator Feedback</h4>
                        {latestFeedback.reason && (
                          <p className="text-sm font-serif text-orange-900/80 mb-3 whitespace-pre-wrap">
                            {latestFeedback.reason}
                          </p>
                        )}
                        {latestHighlights.length > 0 && (
                          <div className="flex flex-col gap-3 mt-3 border-t border-orange-500/20 pt-3">
                            {latestHighlights.map((hl: any) => (
                              <div key={hl.id} className="bg-white/50 p-3 rounded-[2px] text-sm">
                                <p className="font-serif italic text-orange-900 mb-2">&ldquo;{hl.selected_text}&rdquo;</p>
                                <div className="flex gap-2 items-start">
                                  <span className="text-orange-600 font-bold text-xs uppercase mt-0.5">Note:</span>
                                  <p className="text-orange-950">{hl.comment}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 border-foreground/10 pt-4 sm:pt-0">
                    {sub.status === "APPROVED" && (
                      <Link
                        href={`/submission/${sub.id}`}
                        className="flex-1 sm:flex-none flex items-center justify-center p-3 text-foreground/70 hover:text-foreground hover:bg-black/5 rounded-[2px] transition-colors"
                        title="View Public Post"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    )}

                    {(sub.status === "DRAFT" || sub.status === "REVISION_REQUESTED") && (
                      <Link
                        href={`/submit/edit/${sub.id}`}
                        className="flex-1 sm:flex-none flex items-center justify-center p-3 text-foreground/70 hover:text-foreground hover:bg-black/5 rounded-[2px] transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                    )}

                    {sub.status !== "DELETED" && (
                      <DeleteSubmissionButton submissionId={sub.id} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

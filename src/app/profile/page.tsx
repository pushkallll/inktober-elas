import { AuthGuard } from "@/components/auth/AuthGuard";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
import { LayoutDashboard, Shield, Users, ShieldAlert, BookOpen, ScrollText, PenTool, FileText, Send, XCircle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null; // AuthGuard handles redirect
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  // Get submissions stats
  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, status")
    .eq("user_id", user.id);

  const activeSubmissions = submissions?.filter(s => s.status !== "DELETED") || [];
  const posts = activeSubmissions.filter(s => s.status === "APPROVED").length;
  const drafts = activeSubmissions.filter(s => s.status === "DRAFT").length;
  const pending = activeSubmissions.filter(s => s.status === "PENDING_REVIEW").length;
  const rejected = activeSubmissions.filter(s => s.status === "REJECTED").length;
  const totalSubmissions = activeSubmissions.length;

  // Real Yuppsie total: count yuppsies received on APPROVED submissions
  const approvedIds = (submissions || [])
    .filter(s => s.status === "APPROVED")
    .map(s => s.id);

  let totalYuppsies = 0;
  if (approvedIds.length > 0) {
    const { count } = await supabase
      .from("yuppsies")
      .select("*", { count: "exact", head: true })
      .in("submission_id", approvedIds);
    totalYuppsies = count ?? 0;
  }

  const isMod = profile.role === "MODERATOR";
  const isAdmin = profile.role === "ADMIN";

  // Determine badge to show
  let badgeText = undefined;
  if (isAdmin) badgeText = "ADMIN";
  else if (isMod) badgeText = "MODERATOR";

  return (
    <AuthGuard>
      <PageHeader
        title={profile.pen_name || "Profile"}
        subtitle={`${totalYuppsies} Yuppsies · ${totalSubmissions} Submissions`}
        badge={badgeText}
      />

      <div className="w-full max-w-[1000px] mx-auto pb-16">
        <div className="flex flex-col md:flex-row gap-8">
            
            {/* Left Column: Your Work */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="border-b border-foreground/10 pb-2 mb-2">
                <h2 className="font-serif uppercase tracking-widest text-foreground text-sm">Your Work</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Link href="/my-submissions" className="bg-[#f8f5f0]/80 backdrop-blur-sm border border-foreground/10 p-5 rounded-[2px] flex flex-col items-center justify-center text-center hover:bg-white transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center mb-3 group-hover:bg-foreground/10 transition-colors">
                    <FileText className="w-5 h-5 text-foreground/80" />
                  </div>
                  <span className="text-xl font-serif text-foreground mb-1">{posts}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Posts</span>
                </Link>
                
                <Link href="/my-submissions" className="bg-[#f8f5f0]/80 backdrop-blur-sm border border-foreground/10 p-5 rounded-[2px] flex flex-col items-center justify-center text-center hover:bg-white transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center mb-3 group-hover:bg-foreground/10 transition-colors">
                    <PenTool className="w-5 h-5 text-foreground/80" />
                  </div>
                  <span className="text-xl font-serif text-foreground mb-1">{drafts}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Drafts</span>
                </Link>
                
                <Link href="/my-submissions" className="bg-[#f8f5f0]/80 backdrop-blur-sm border border-foreground/10 p-5 rounded-[2px] flex flex-col items-center justify-center text-center hover:bg-white transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-3 group-hover:bg-amber-500/20 transition-colors">
                    <Clock className="w-5 h-5 text-amber-700" />
                  </div>
                  <span className="text-xl font-serif text-foreground mb-1">{pending}</span>
                  <span className="text-[10px] uppercase tracking-wider text-amber-800 font-bold">Pending</span>
                </Link>
                
                <Link href="/my-submissions" className="bg-[#f8f5f0]/80 backdrop-blur-sm border border-foreground/10 p-5 rounded-[2px] flex flex-col items-center justify-center text-center hover:bg-white transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-3 group-hover:bg-red-500/20 transition-colors">
                    <XCircle className="w-5 h-5 text-red-700" />
                  </div>
                  <span className="text-xl font-serif text-foreground mb-1">{rejected}</span>
                  <span className="text-[10px] uppercase tracking-wider text-red-800 font-bold">Rejected</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Administration (only for MODERATOR or ADMIN) */}
            {(isAdmin || isMod) && (
              <div className="flex-1 flex flex-col gap-6">
                <div className="border-b border-foreground/10 pb-2 mb-2">
                  <h2 className="font-serif uppercase tracking-widest text-foreground text-sm">
                    {isAdmin ? "Administration" : "Moderation"}
                  </h2>
                </div>
                
                <div className="flex flex-col gap-3">
                  <Link href="/moderation" className="bg-[#f8f5f0]/95 backdrop-blur-sm border border-foreground/10 p-4 rounded-[2px] flex items-center gap-4 hover:bg-white hover:border-amber-800/30 transition-all group shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Shield className="w-5 h-5 text-amber-800" />
                    </div>
                    <div>
                      <h3 className="font-serif text-foreground">Moderation</h3>
                      <p className="text-xs text-muted">Review pending submissions</p>
                    </div>
                  </Link>

                  {isAdmin && (
                    <>
                      <Link href="/admin" className="bg-[#f8f5f0]/95 backdrop-blur-sm border border-foreground/10 p-4 rounded-[2px] flex items-center gap-4 hover:bg-white hover:border-foreground/30 transition-all group shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <LayoutDashboard className="w-5 h-5 text-foreground/80" />
                        </div>
                        <div>
                          <h3 className="font-serif text-foreground">Admin Dashboard</h3>
                          <p className="text-xs text-muted">Manage the platform</p>
                        </div>
                      </Link>
                      
                      <Link href="/admin/users" className="bg-[#f8f5f0]/95 backdrop-blur-sm border border-foreground/10 p-4 rounded-[2px] flex items-center gap-4 hover:bg-white hover:border-foreground/30 transition-all group shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <Users className="w-5 h-5 text-foreground/80" />
                        </div>
                        <div>
                          <h3 className="font-serif text-foreground">Users</h3>
                          <p className="text-xs text-muted">Manage accounts and roles</p>
                        </div>
                      </Link>

                      <Link href="/admin/appeals" className="bg-[#f8f5f0]/95 backdrop-blur-sm border border-foreground/10 p-4 rounded-[2px] flex items-center gap-4 hover:bg-white hover:border-red-700/30 transition-all group shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <ShieldAlert className="w-5 h-5 text-red-700" />
                        </div>
                        <div>
                          <h3 className="font-serif text-foreground">Appeals</h3>
                          <p className="text-xs text-muted">Review and resolve appeals</p>
                        </div>
                      </Link>
                      
                      <Link href="/admin/prompts" className="bg-[#f8f5f0]/95 backdrop-blur-sm border border-foreground/10 p-4 rounded-[2px] flex items-center gap-4 hover:bg-white hover:border-foreground/30 transition-all group shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <BookOpen className="w-5 h-5 text-foreground/80" />
                        </div>
                        <div>
                          <h3 className="font-serif text-foreground">Prompts</h3>
                          <p className="text-xs text-muted">Manage Inktober prompts</p>
                        </div>
                      </Link>

                      <Link href="/admin/guidelines" className="bg-[#f8f5f0]/95 backdrop-blur-sm border border-foreground/10 p-4 rounded-[2px] flex items-center gap-4 hover:bg-white hover:border-foreground/30 transition-all group shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <ScrollText className="w-5 h-5 text-foreground/80" />
                        </div>
                        <div>
                          <h3 className="font-serif text-foreground">Community Guidelines</h3>
                          <p className="text-xs text-muted">Manage platform rules</p>
                        </div>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
            
          </div>
        </div>
    </AuthGuard>

  );
}

import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Shield, Users, ShieldAlert, BookOpen, ScrollText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  // Basic stats
  const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true });
  const { data: users } = await supabase.from("users").select("status");
  const activeUsers = users?.filter(u => u.status === "ACTIVE").length || 0;
  const suspendedUsers = users?.filter(u => u.status === "SUSPENDED").length || 0;

  const { data: stats } = await supabase.from("submissions").select("status");
  const pendingCount = stats?.filter(s => s.status === "PENDING_REVIEW").length || 0;
  const approvedCount = stats?.filter(s => s.status === "APPROVED").length || 0;

  const { count: openAppeals } = await supabase.from("appeals").select("*", { count: "exact", head: true }).eq("status", "PENDING");
  const { count: totalPrompts } = await supabase.from("prompts").select("*", { count: "exact", head: true });

  return (
    <div className="flex flex-col gap-10 max-w-4xl">
      <section>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/70 border border-foreground/10 p-4 rounded-[2px] text-center shadow-sm">
            <div className="text-2xl font-serif text-amber-700 mb-1">{pendingCount}</div>
            <div className="text-[9px] uppercase tracking-wider text-muted font-bold">Pending Reviews</div>
          </div>
          <div className="bg-white/70 border border-foreground/10 p-4 rounded-[2px] text-center shadow-sm">
            <div className="text-2xl font-serif text-red-700 mb-1">{openAppeals || 0}</div>
            <div className="text-[9px] uppercase tracking-wider text-muted font-bold">Open Appeals</div>
          </div>
          <div className="bg-white/70 border border-foreground/10 p-4 rounded-[2px] text-center shadow-sm">
            <div className="text-2xl font-serif text-foreground mb-1">{activeUsers}</div>
            <div className="text-[9px] uppercase tracking-wider text-muted font-bold">Active Users</div>
          </div>
          <div className="bg-white/70 border border-foreground/10 p-4 rounded-[2px] text-center shadow-sm">
            <div className="text-2xl font-serif text-foreground mb-1">{suspendedUsers}</div>
            <div className="text-[9px] uppercase tracking-wider text-muted font-bold">Suspended Users</div>
          </div>
          <div className="bg-white/70 border border-foreground/10 p-4 rounded-[2px] text-center shadow-sm">
            <div className="text-2xl font-serif text-green-700 mb-1">{approvedCount}</div>
            <div className="text-[9px] uppercase tracking-wider text-muted font-bold">Approved Posts</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#f8f5f0] border border-foreground/10 p-6 rounded-[2px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] flex flex-col items-start">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-amber-800" />
            <h3 className="text-lg font-serif uppercase tracking-widest text-foreground">Moderation</h3>
          </div>
          <p className="text-sm text-muted mb-6">{pendingCount} pending submissions</p>
          <Link href="/moderation" className="mt-auto text-xs uppercase tracking-widest text-amber-800 font-bold hover:text-amber-900 flex items-center gap-1 group">
            Review <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="bg-[#f8f5f0] border border-foreground/10 p-6 rounded-[2px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] flex flex-col items-start">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-foreground/70" />
            <h3 className="text-lg font-serif uppercase tracking-widest text-foreground">Users</h3>
          </div>
          <p className="text-sm text-muted mb-6">{totalUsers || 0} accounts</p>
          <Link href="/admin/users" className="mt-auto text-xs uppercase tracking-widest text-foreground/80 font-bold hover:text-foreground flex items-center gap-1 group">
            Manage <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="bg-[#f8f5f0] border border-foreground/10 p-6 rounded-[2px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] flex flex-col items-start">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-5 h-5 text-red-700/80" />
            <h3 className="text-lg font-serif uppercase tracking-widest text-foreground">Appeals</h3>
          </div>
          <p className="text-sm text-muted mb-6">{openAppeals || 0} open appeals</p>
          <Link href="/admin/appeals" className="mt-auto text-xs uppercase tracking-widest text-red-700/80 font-bold hover:text-red-800 flex items-center gap-1 group">
            Review <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="bg-[#f8f5f0] border border-foreground/10 p-6 rounded-[2px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] flex flex-col items-start">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-foreground/70" />
            <h3 className="text-lg font-serif uppercase tracking-widest text-foreground">Prompts</h3>
          </div>
          <p className="text-sm text-muted mb-6">{totalPrompts || 0} prompts</p>
          <Link href="/admin/prompts" className="mt-auto text-xs uppercase tracking-widest text-foreground/80 font-bold hover:text-foreground flex items-center gap-1 group">
            Manage <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="bg-[#f8f5f0] border border-foreground/10 p-6 rounded-[2px] shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)] flex flex-col items-start md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-2">
            <ScrollText className="w-5 h-5 text-foreground/70" />
            <h3 className="text-lg font-serif uppercase tracking-widest text-foreground">Guidelines</h3>
          </div>
          <p className="text-sm text-muted mb-6">Community rules</p>
          <Link href="/admin/guidelines" className="mt-auto text-xs uppercase tracking-widest text-foreground/80 font-bold hover:text-foreground flex items-center gap-1 group">
            Manage <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

import { AuthGuard } from "@/components/auth/AuthGuard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, UserX, Shield, ShieldAlert, BookOpen, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Verify caller is ADMIN
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ADMIN") {
    redirect("/"); // Or to moderation if they are moderator, but let's just go home
  }

  return (
    <AuthGuard>
      <PageHeader
        title="Admin Control"
        subtitle="Manage users, roles, and system settings"
        badge="Admin"
      />
      <div className="w-full max-w-[1200px] mx-auto pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 flex-shrink-0">
            <nav className="flex flex-col gap-2">
              <Link href="/admin" className="flex items-center gap-3 px-4 py-3 bg-white/70 hover:bg-white border border-foreground/10 rounded-[2px] text-sm uppercase tracking-wider font-bold text-foreground/80 transition-colors">
                <LayoutDashboard className="w-4 h-4" /> Overview
              </Link>
              <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 bg-white/70 hover:bg-white border border-foreground/10 rounded-[2px] text-sm uppercase tracking-wider font-bold text-foreground/80 transition-colors">
                <Users className="w-4 h-4" /> User Management
              </Link>
              <Link href="/admin/appeals" className="flex items-center gap-3 px-4 py-3 bg-white/70 hover:bg-white border border-foreground/10 rounded-[2px] text-sm uppercase tracking-wider font-bold text-foreground/80 transition-colors">
                <ShieldAlert className="w-4 h-4" /> Appeals
              </Link>
              <Link href="/admin/prompts" className="flex items-center gap-3 px-4 py-3 bg-white/70 hover:bg-white border border-foreground/10 rounded-[2px] text-sm uppercase tracking-wider font-bold text-foreground/80 transition-colors">
                <BookOpen className="w-4 h-4" /> Prompts
              </Link>
              <Link href="/admin/guidelines" className="flex items-center gap-3 px-4 py-3 bg-white/70 hover:bg-white border border-foreground/10 rounded-[2px] text-sm uppercase tracking-wider font-bold text-foreground/80 transition-colors">
                <ScrollText className="w-4 h-4" /> Guidelines
              </Link>
            </nav>
          </aside>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

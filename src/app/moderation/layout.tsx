import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function ModerationLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "MODERATOR" && profile.role !== "ADMIN")) {
    // Normal users get redirected
    redirect("/");
  }

  return (
    <>
      <PageHeader
        title="Moderation"
        subtitle="Pending submissions requiring review"
        badge={profile.role}
      >
        <nav className="flex gap-6 text-[11px] uppercase tracking-[0.2em] font-medium">
          <Link href="/moderation" className="text-amber-800 hover:text-amber-900 transition-colors">Queue</Link>
          {profile.role === "ADMIN" && (
            <Link href="/admin" className="text-muted hover:text-foreground transition-colors">Admin</Link>
          )}
          <Link href="/" className="text-muted hover:text-foreground transition-colors">Back to Site</Link>
        </nav>
      </PageHeader>

      <div className="w-full max-w-7xl mx-auto pb-16">
        <main>
          {children}
        </main>
      </div>
    </>
  );
}


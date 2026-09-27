import { AuthGuard } from "@/components/auth/AuthGuard";
import { SubmitForm } from "./SubmitForm";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let role = "USER";
  if (user) {
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (profile) role = profile.role;
  }

  const { data: prompts } = await supabase
    .from("prompts")
    .select("id, day, prompt")
    .eq("active", true)
    .order("day", { ascending: true });
    
  return (
    <AuthGuard>
      <PageHeader
        title="Submit"
        subtitle="Share your work with the community"
      />
      <div className="w-full max-w-[700px] mx-auto pb-16">
        <SubmitForm prompts={prompts || []} userRole={role} />
      </div>
    </AuthGuard>
  );
}

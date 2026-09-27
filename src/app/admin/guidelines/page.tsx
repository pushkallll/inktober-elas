import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminGuidelinesPage() {
  const supabase = await createClient();

  const { data: guidelines } = await supabase
    .from("community_guidelines")
    .select("*")
    .order("version", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#f8f5f0] border border-foreground/10 p-6 rounded-[2px] shadow-sm">
        <h2 className="text-xl font-serif text-foreground mb-6">Community Guidelines Management</h2>
        <p className="text-sm text-muted mb-6">Manage the community guidelines presented to users.</p>
        
        <div className="flex flex-col gap-4">
          {guidelines?.map((guideline: any) => (
            <div key={guideline.id} className="bg-white/70 border border-foreground/10 p-4 rounded-[2px] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-serif text-lg text-foreground">
                  {guideline.title} <span className="text-xs text-muted font-sans">(v{guideline.version})</span>
                </h3>
                {guideline.active ? (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-green-500/10 text-green-700 rounded-[2px] font-bold">Active</span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-gray-500/10 text-gray-700 rounded-[2px] font-bold">Inactive</span>
                )}
              </div>
              <pre className="text-xs text-muted whitespace-pre-wrap font-sans bg-foreground/5 p-3 rounded-[2px] border border-foreground/10">
                {guideline.content}
              </pre>
            </div>
          ))}
          {(!guidelines || guidelines.length === 0) && (
            <p className="text-sm text-muted">No guidelines found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

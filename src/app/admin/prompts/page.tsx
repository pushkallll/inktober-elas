import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPromptsPage() {
  const supabase = await createClient();

  const { data: prompts } = await supabase
    .from("prompts")
    .select("*")
    .order("day", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#f8f5f0] border border-foreground/10 p-6 rounded-[2px] shadow-sm">
        <h2 className="text-xl font-serif text-foreground mb-6">Prompts Management</h2>
        <p className="text-sm text-muted mb-6">Manage the official 31-day prompt list for Inktober 2026.</p>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-foreground/10">
                <th className="pb-3 font-serif uppercase tracking-widest text-xs text-foreground/70">Day</th>
                <th className="pb-3 font-serif uppercase tracking-widest text-xs text-foreground/70">Prompt</th>
                <th className="pb-3 font-serif uppercase tracking-widest text-xs text-foreground/70">Status</th>
              </tr>
            </thead>
            <tbody>
              {prompts?.map((prompt: any) => (
                <tr key={prompt.id} className="border-b border-foreground/5 hover:bg-white/50 transition-colors">
                  <td className="py-3 font-bold text-foreground/80">{prompt.day}</td>
                  <td className="py-3 text-foreground font-medium">{prompt.prompt}</td>
                  <td className="py-3">
                    {prompt.active ? (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-green-500/10 text-green-700 rounded-[2px] font-bold">Active</span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-gray-500/10 text-gray-700 rounded-[2px] font-bold">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

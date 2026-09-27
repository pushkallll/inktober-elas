import { createClient } from "@/lib/supabase/server";
import { AppealsClient } from "./AppealsClient";

export const dynamic = "force-dynamic";

export default async function AppealsPage() {
  const supabase = await createClient();

  const { data: appeals } = await supabase
    .from("appeals")
    .select(`
      *,
      users!appeals_user_id_fkey ( id, pen_name )
    `)
    .order("submitted_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white/70 border border-foreground/10 p-6 rounded-[2px] shadow-sm">
        <h2 className="text-xl font-serif text-foreground mb-6">Appeals Queue</h2>
        <AppealsClient appeals={appeals || []} />
      </div>
    </div>
  );
}

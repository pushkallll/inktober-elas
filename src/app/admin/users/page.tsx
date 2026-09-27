import { createClient } from "@/lib/supabase/server";
import { UserManagementClient } from "./UserManagementClient";

export const dynamic = "force-dynamic";

export default async function UserManagementPage() {
  const supabase = await createClient();

  // Fetch all users with basic stats
  const { data: users } = await supabase
    .from("users")
    .select(`
      id, pen_name, role, status, created_at, suspended_until, suspension_reason,
      submissions ( id, status )
    `)
    .order("created_at", { ascending: false });

  // Map user data to include submission counts
  const usersWithStats = users?.map(u => ({
    ...u,
    totalSubmissions: u.submissions.length,
    approvedSubmissions: u.submissions.filter((s: any) => s.status === "APPROVED").length,
    rejectedSubmissions: u.submissions.filter((s: any) => s.status === "REJECTED").length,
  })) || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white/70 border border-foreground/10 p-6 rounded-[2px] shadow-sm">
        <h2 className="text-xl font-serif text-foreground mb-6">User Management</h2>
        <UserManagementClient users={usersWithStats} />
      </div>
    </div>
  );
}

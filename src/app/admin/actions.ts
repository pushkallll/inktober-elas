"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

async function getAdminClient() {
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabaseAuth
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "ADMIN") {
    throw new Error("Forbidden: Admin only");
  }

  return {
    adminClient: createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    ),
    actorId: user.id
  };
}

export async function updateUserRole(userId: string, newRole: string) {
  const { adminClient, actorId } = await getAdminClient();

  const { error } = await adminClient
    .from("users")
    .update({ role: newRole })
    .eq("id", userId);

  if (error) throw new Error("Failed to update role");

  await adminClient.from("audit_logs").insert([{
    actor_id: actorId,
    target_id: userId,
    action: "ROLE_CHANGE",
    details: { newRole }
  }]);

  revalidatePath("/admin/users");
  return { success: true };
}

export async function suspendUser(userId: string, days: number, reason: string) {
  const { adminClient, actorId } = await getAdminClient();

  const suspendedUntil = new Date();
  suspendedUntil.setDate(suspendedUntil.getDate() + days);

  const { error } = await adminClient
    .from("users")
    .update({
      suspended_until: suspendedUntil.toISOString(),
      suspension_reason: reason
    })
    .eq("id", userId);

  if (error) throw new Error("Failed to suspend user");

  await adminClient.from("audit_logs").insert([{
    actor_id: actorId,
    target_id: userId,
    action: "SUSPEND_USER",
    details: { days, reason, suspendedUntil }
  }]);

  revalidatePath("/admin/users");
  return { success: true };
}

export async function banUser(userId: string, reason: string) {
  const { adminClient, actorId } = await getAdminClient();

  const { error } = await adminClient
    .from("users")
    .update({
      status: "BANNED",
      suspension_reason: reason
    })
    .eq("id", userId);

  if (error) throw new Error("Failed to ban user");

  // Also reject all their pending/approved submissions to hide them
  await adminClient
    .from("submissions")
    .update({ status: "REJECTED" })
    .eq("user_id", userId)
    .in("status", ["APPROVED", "PENDING_REVIEW", "REVISION_REQUESTED"]);

  await adminClient.from("audit_logs").insert([{
    actor_id: actorId,
    target_id: userId,
    action: "BAN_USER",
    details: { reason }
  }]);

  revalidatePath("/admin/users");
  revalidatePath("/moderation");
  revalidatePath("/");
  return { success: true };
}

export async function processAppeal(appealId: string, decision: "ACCEPTED" | "DENIED", decisionReason: string) {
  const { adminClient, actorId } = await getAdminClient();

  // Get appeal
  const { data: appeal } = await adminClient
    .from("appeals")
    .select("*")
    .eq("id", appealId)
    .single();

  if (!appeal) throw new Error("Appeal not found");
  if (appeal.status !== "PENDING") throw new Error("Appeal already processed");

  // Update appeal
  const { error } = await adminClient
    .from("appeals")
    .update({
      status: decision,
      reviewed_by: actorId,
      reviewed_at: new Date().toISOString(),
      decision_reason: decisionReason
    })
    .eq("id", appealId);

  if (error) throw new Error("Failed to process appeal");

  // If ACCEPTED, depending on type, we may auto-unban, auto-unsuspend, or auto-unreject
  if (decision === "ACCEPTED") {
    if (appeal.appeal_type === "BAN") {
      await adminClient.from("users").update({ status: "ACTIVE", suspension_reason: null }).eq("id", appeal.user_id);
    } else if (appeal.appeal_type === "SUSPENSION") {
      await adminClient.from("users").update({ suspended_until: null, suspension_reason: null }).eq("id", appeal.user_id);
    } else if (appeal.appeal_type === "CONTENT" && appeal.target_id) {
      await adminClient.from("submissions").update({ status: "PENDING_REVIEW" }).eq("id", appeal.target_id);
    }
  }

  await adminClient.from("audit_logs").insert([{
    actor_id: actorId,
    target_id: appealId,
    action: "PROCESS_APPEAL",
    details: { decision, decisionReason, appealType: appeal.appeal_type }
  }]);

  revalidatePath("/admin/appeals");
  revalidatePath("/admin/users");
  revalidatePath("/moderation");
  return { success: true };
}

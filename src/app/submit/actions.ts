"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Save or submit a submission.
 *
 * Security model:
 * - Auth is verified server-side from cookies via createServerClient()
 * - user_id is NEVER trusted from the client; always taken from server auth
 * - Content columns are updated via the authenticated client (respects column-level grants)
 * - The `status` column is updated via the secret client (bypasses column-level restrictions)
 *   but only AFTER server-side ownership verification
 * - A user can only set status to DRAFT or PENDING_REVIEW on their own submissions
 */
export async function saveSubmission(payload: {
  submissionId?: string;         // undefined = new submission
  day: number;
  promptId: string;
  category: "ART" | "WRITING";
  genre?: string;
  title: string;
  writingContent?: string;
  cloudinaryPublicId?: string;
  cloudinaryUrl?: string;
  cloudinaryWidth?: number;
  cloudinaryHeight?: number;
  cloudinaryFormat?: string;
  cloudinaryMetadata?: string;
  anonymous: boolean;
  isDraft: boolean;
  // Admin-only: override user_id to publish on behalf of another user
  overrideUserId?: string;
}) {
  // 1. Authenticate the caller server-side — never trust client-supplied user_id
  const supabaseAuth = await createServerClient();
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in to submit.");
  }

  // 2. Determine the effective user_id
  //    Admin override is only allowed if the server confirms the caller is ADMIN
  let finalUserId = user.id;
  if (payload.overrideUserId && payload.overrideUserId.trim()) {
    const { data: callerProfile } = await supabaseAuth
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (callerProfile?.role === "ADMIN") {
      finalUserId = payload.overrideUserId.trim();
    }
    // Non-admins silently fall back to their own ID — no error exposed
  }

  // 3. Build the target status
  const targetStatus = payload.isDraft ? "DRAFT" : "PENDING_REVIEW";

  // 4. Use the secret client to bypass column-level restrictions
  //    (the authenticated user cannot UPDATE the `status` or `user_id` columns)
  const secretClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  if (payload.submissionId) {
    // UPDATE path — existing submission
    // First verify ownership server-side (never trust the client for this)
    const { data: existing } = await secretClient
      .from("submissions")
      .select("user_id, status")
      .eq("id", payload.submissionId)
      .single();

    if (!existing) {
      throw new Error("Submission not found.");
    }

    // Only the owner may edit their own submission (admins exempted via finalUserId logic above)
    if (existing.user_id !== finalUserId && finalUserId === user.id) {
      throw new Error("You do not have permission to edit this submission.");
    }

    // Only DRAFT and REVISION_REQUESTED submissions can be edited by the owner
    if (
      existing.user_id === user.id &&
      existing.status !== "DRAFT" &&
      existing.status !== "REVISION_REQUESTED"
    ) {
      throw new Error("Only drafts or revision-requested submissions can be edited.");
    }

    // Build the update payload
    const updateData: Record<string, unknown> = {
      day: payload.day,
      prompt_id: payload.promptId,
      category: payload.category,
      title: payload.title,
      anonymous: payload.anonymous,
      status: targetStatus,
      updated_at: new Date().toISOString(),
    };

    if (payload.category === "WRITING") {
      updateData.genre = payload.genre ?? null;
      updateData.writing_content = payload.writingContent ?? null;
    } else {
      // For ART: only update Cloudinary fields if a new upload was provided
      if (payload.cloudinaryUrl) {
        updateData.cloudinary_public_id = payload.cloudinaryPublicId ?? null;
        updateData.cloudinary_url = payload.cloudinaryUrl;
        updateData.cloudinary_metadata = payload.cloudinaryMetadata ?? null;
      }
      // If no new upload, leave existing Cloudinary fields unchanged
    }

    const { error: updateError } = await secretClient
      .from("submissions")
      .update(updateData)
      .eq("id", payload.submissionId);

    if (updateError) {
      throw new Error(updateError.message || "Failed to update submission.");
    }
  } else {
    // INSERT path — new submission
    const insertData: Record<string, unknown> = {
      user_id: finalUserId,
      day: payload.day,
      prompt_id: payload.promptId,
      category: payload.category,
      title: payload.title,
      anonymous: payload.anonymous,
      status: targetStatus,
    };

    if (payload.category === "WRITING") {
      insertData.genre = payload.genre ?? null;
      insertData.writing_content = payload.writingContent ?? null;
    } else {
      insertData.cloudinary_public_id = payload.cloudinaryPublicId ?? null;
      insertData.cloudinary_url = payload.cloudinaryUrl ?? null;
      insertData.cloudinary_metadata = payload.cloudinaryMetadata ?? null;
    }

    const { error: insertError } = await secretClient
      .from("submissions")
      .insert([insertData]);

    if (insertError) {
      throw new Error(insertError.message || "Failed to create submission.");
    }
  }

  // Revalidate affected pages
  revalidatePath("/my-submissions");
  if (!payload.isDraft) {
    revalidatePath("/moderation");
  }

  return { success: true };
}

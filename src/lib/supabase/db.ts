import { createClient } from "./client";
import { UserProfile } from "../types/user";

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    if (error?.code !== 'PGRST116') { // PGRST116 means no rows returned
      console.error("Error fetching user profile:", error);
      throw new Error("Database error while fetching profile.");
    }
    return null;
  }

  return {
    id: data.id,
    penName: data.pen_name,
    role: data.role,
    status: data.status,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
  };
}

export async function claimPenNameAndCreateProfile(
  userId: string,
  email: string,
  penName: string
): Promise<UserProfile> {
  const supabase = createClient();
  const normalized = penName.trim().toLowerCase().replace(/\s+/g, "");

  if (!normalized) {
    throw new Error("Pen name cannot be empty.");
  }

  console.log("[ONBOARDING DIAGNOSTICS] Starting claimPenNameAndCreateProfile for:", { userId, email, penName: penName.trim() });

  // Call the secure RPC function to create the profile
  const { data, error } = await supabase
    .rpc('claim_pen_name', {
      new_pen_name: penName.trim(),
      new_pen_name_normalized: normalized
    })
    .single();

  console.log("[ONBOARDING DIAGNOSTICS] RPC claim_pen_name completed. Result:", {
    hasData: !!data,
    hasError: !!error,
    errorCode: error?.code,
    errorMessage: error?.message,
    errorDetails: error?.details
  });

  if (error) {
    if (error.code === '23505') { // Unique violation
      throw new Error("pen_name_taken");
    }
    throw error;
  }

  const userData = data as any;
  console.log("[ONBOARDING DIAGNOSTICS] User data received from RPC:", userData ? "Exists" : "Null");

  return {
    id: userData.id,
    penName: userData.pen_name,
    role: userData.role,
    status: userData.status,
    createdAt: new Date(userData.created_at).getTime(),
    updatedAt: new Date(userData.updated_at).getTime(),
  };
}

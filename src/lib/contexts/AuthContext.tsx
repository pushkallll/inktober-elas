"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "../supabase/client";
import { getUserProfile, claimPenNameAndCreateProfile } from "../supabase/db";
import { UserProfile } from "../types/user";

export type AuthState =
  | "LOADING"
  | "SIGNED_OUT"
  | "AUTHENTICATED"
  | "ONBOARDING"
  | "SUSPENDED"
  | "BANNED"
  | "ERROR";

interface AuthContextType {
  state: AuthState;
  user: SupabaseUser | null;
  profile: UserProfile | null;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (penName: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>("LOADING");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session?.user || null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        handleAuthChange(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthChange = async (supabaseUser: SupabaseUser | null) => {
    if (!supabaseUser) {
      setUser(null);
      setProfile(null);
      setState("SIGNED_OUT");
      return;
    }

    const campusDomain = process.env.NEXT_PUBLIC_CAMPUS_EMAIL_DOMAIN || "hyderabad.bits-pilani.ac.in";
    if (!supabaseUser.email?.endsWith(`@${campusDomain}`)) {
      await createClient().auth.signOut();
      setError(`Only @${campusDomain} accounts are allowed.`);
      setState("ERROR");
      return;
    }

    setUser(supabaseUser);

    try {
      const userProfile = await getUserProfile(supabaseUser.id);
      if (!userProfile) {
        setState("ONBOARDING");
      } else if (userProfile.status === "SUSPENDED") {
        setProfile(userProfile);
        setState("SUSPENDED");
      } else if (userProfile.status === "BANNED") {
        setProfile(userProfile);
        setState("BANNED");
      } else {
        setProfile(userProfile);
        setState("AUTHENTICATED");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load user profile");
      setState("ERROR");
    }
  };

  const login = async () => {
    try {
      const start = performance.now();
      console.log(`[OAuth Trace] Click to login start: 0ms`);
      setError(null);

      const t1 = performance.now();
      const supabase = createClient();
      const t2 = performance.now();
      console.log(`[OAuth Trace] createClient took: ${t2 - t1}ms`);

      const t3 = performance.now();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback` // standard auth callback
        }
      });
      const t4 = performance.now();
      console.log(`[OAuth Trace] signInWithOAuth invocation took: ${t4 - t3}ms`);

      if (error) throw error;
      // redirect happens automatically
      console.log(`[OAuth Trace] Total time before redirect: ${performance.now() - start}ms`);
    } catch (err: any) {
      setError(err.message || "Login failed");
      setState("ERROR");
    }
  };

  const logout = async () => {
    setState("LOADING");
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  const completeOnboarding = async (penName: string) => {
    if (!user || !user.email) {
      console.log("[ONBOARDING DIAGNOSTICS] completeOnboarding failed: Missing user or email", { user: !!user, email: !!user?.email });
      return;
    }
    console.log("[ONBOARDING DIAGNOSTICS] completeOnboarding initiated for:", user.id);
    try {
      setError(null);
      setState("LOADING");
      const newProfile = await claimPenNameAndCreateProfile(user.id, user.email, penName);
      console.log("[ONBOARDING DIAGNOSTICS] completeOnboarding succeeded. Profile created:", !!newProfile);
      setProfile(newProfile);
      setState("AUTHENTICATED");
    } catch (err: any) {
      console.log("[ONBOARDING DIAGNOSTICS] completeOnboarding caught error:", {
        message: err.message,
        code: err.code
      });
      if (err.message === "pen_name_taken") {
        setError("That pen name is already taken. Please choose another.");
      } else {
        setError(err.message || "Failed to complete onboarding.");
      }
      setState("ONBOARDING");
      throw err;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const userProfile = await getUserProfile(user.id);
      if (userProfile) {
        setProfile(userProfile);
      }
    } catch (err) {
      console.error("Failed to refresh profile", err);
    }
  };

  return (
    <AuthContext.Provider value={{ state, user, profile, error, login, logout, completeOnboarding, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

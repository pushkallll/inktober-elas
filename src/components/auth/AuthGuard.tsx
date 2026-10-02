"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import { useState, useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { state, error, login, completeOnboarding } = useAuth();
  const [penName, setPenName] = useState("");
  const [onboardingError, setOnboardingError] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const errParam = params.get('error');
      if (errParam) {
        setUrlError(errParam);
      }
    }
  }, []);

  const handleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (penName.length < 3) {
      setOnboardingError("Pen name must be at least 3 characters");
      return;
    }
    try {
      setIsSubmitting(true);
      setOnboardingError("");
      await completeOnboarding(penName);
    } catch (err: any) {
      setOnboardingError(err.message || "Failed to set pen name.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (state === "LOADING") {
    return (
      <div className="w-full flex justify-center py-32">
        <div className="text-muted font-sans uppercase tracking-widest text-xs animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (state === "ERROR" || state === "SIGNED_OUT") {
    return (
      <div className="w-full flex flex-col items-center min-h-[60vh] py-12 sm:py-20 px-4">
        <div className="w-full max-w-[500px] bg-[#f8f5f0]/95 backdrop-blur-[2px] border border-foreground/10 shadow-lg p-10 sm:p-14 flex flex-col items-center text-center relative">
          <h1 className="text-2xl font-serif text-foreground mb-2">INKTOBER 2026 × ELAS</h1>
          <p className="text-muted italic font-serif mb-8">Create. Write. Share.</p>

          {(error || urlError) && (
            <div className="bg-red-50 text-red-800 border border-red-200 text-xs p-3 mb-6 w-full text-left">
              <span className="font-bold uppercase tracking-wider block mb-1">Authentication Error</span>
              {error || urlError}
            </div>
          )}

          <button
            onClick={login}
            className="w-full bg-foreground text-background font-sans uppercase tracking-[0.2em] text-[10px] sm:text-xs py-4 hover:bg-foreground/90 transition-colors"
          >
            Continue with Google
          </button>

          <p className="mt-6 text-[10px] sm:text-xs text-muted uppercase tracking-widest font-sans">
            Campus accounts only
          </p>
        </div>
      </div>
    );
  }

  if (state === "ONBOARDING") {
    return (
      <div className="w-full flex flex-col items-center min-h-[60vh] py-12 sm:py-20 px-4">
        <div className="w-full max-w-[500px] bg-[#f8f5f0]/95 backdrop-blur-[2px] border border-foreground/10 shadow-lg p-10 sm:p-14 flex flex-col items-center text-center relative">
          <h1 className="text-2xl font-serif text-foreground mb-4">WELCOME TO INKTOBER</h1>
          <p className="text-muted text-sm leading-relaxed mb-8">
            Choose your pen name. <br />
            Your pen name is the name displayed on your public submissions unless you make an anonymous post.
          </p>

          {(error || onboardingError) && (
            <div className="bg-red-50 text-red-800 border border-red-200 text-xs p-3 mb-6 w-full text-left">
              {error || onboardingError}
            </div>
          )}

          <form onSubmit={handleOnboarding} className="w-full flex flex-col items-center">
            <input
              type="text"
              value={penName}
              onChange={(e) => setPenName(e.target.value)}
              placeholder="Pen name"
              className="w-full bg-white/60 border border-foreground/20 px-4 py-3 text-sm focus:outline-none focus:border-foreground/50 transition-colors text-center mb-6 placeholder:text-muted/60"
              required
              minLength={3}
              maxLength={30}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-foreground text-background font-sans uppercase tracking-[0.2em] text-xs py-4 hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (state === "SUSPENDED" || state === "BANNED") {
    return (
      <div className="w-full flex flex-col items-center min-h-[60vh] py-20 px-4">
        <div className="w-full max-w-[500px] bg-[#f8f5f0]/95 backdrop-blur-[2px] border border-foreground/10 shadow-lg p-14 flex flex-col items-center text-center">
          <h1 className="text-2xl font-serif text-foreground mb-4">ACCOUNT RESTRICTED</h1>
          <p className="text-muted text-sm">Your account has been {state.toLowerCase()}.</p>
        </div>
      </div>
    );
  }

  // If AUTHENTICATED
  return <>{children}</>;
}

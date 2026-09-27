"use client";

import { useState, useTransition } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { toggleYuppsie } from "@/app/actions/yuppsies";
import { Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  submission: {
    id: string;
    category: string;
    genre: string | null;
    title: string;
    content: string;
    imageUrl: string;
    authorDisplay: string;
    day: number;
    prompt: string;
    yuppsiesCount: number;
    anonymous: boolean;
  };
  initialYuppsied?: boolean;
}

export function PublicSubmissionClient({ submission, initialYuppsied = false }: Props) {
  const { state, login } = useAuth();
  const [yuppsied, setYuppsied] = useState(initialYuppsied);
  const [count, setCount] = useState(submission.yuppsiesCount);
  const [isPending, startTransition] = useTransition();
  const [loginPrompt, setLoginPrompt] = useState(false);

  const isAuthenticated = state === "AUTHENTICATED";
  const isArt = submission.category === "ART";

  const handleYuppsie = () => {
    if (!isAuthenticated) {
      setLoginPrompt(true);
      return;
    }
    const intent = !yuppsied;
    setYuppsied(intent);
    setCount((prev: number) => prev + (intent ? 1 : -1));

    startTransition(async () => {
      try {
        const result = await toggleYuppsie(submission.id, intent);
        if (result.error) {
          console.error("Yuppsie failed:", result.error);
          setYuppsied(!intent);
          setCount((prev: number) => prev + (intent ? -1 : 1));
          return;
        }
        setYuppsied(result.yuppsied!);
        setCount(result.count!);
      } catch (err) {
        console.error("Yuppsie threw exception:", err);
        setYuppsied(!intent);
        setCount((prev: number) => prev + (intent ? -1 : 1));
      }
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-16 px-4 sm:px-0">
      {/* Back navigation */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Gallery
        </Link>
      </div>

      {/* Metadata header */}
      <div className="mb-8 text-center">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted mb-3">
          Day {submission.day} · {submission.prompt}
          {submission.genre && <> · {submission.genre}</>}
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-3 leading-tight">
          {submission.title}
        </h1>
        <div className="text-xs uppercase tracking-[0.2em] text-muted">
          {submission.authorDisplay}
        </div>
      </div>

      {/* Content */}
      {isArt ? (
        <div className="bg-card p-4 pb-14 shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-[2px] mx-auto max-w-xl">
          <img
            src={submission.imageUrl}
            alt={submission.title}
            className="w-full h-auto object-contain rounded-[1px]"
          />
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span className="font-serif italic text-[10px] text-foreground/40">
              Day {submission.day} · {submission.prompt}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-[#f8f5f0] border border-foreground/5 rounded-[2px] p-7 sm:p-12 shadow-sm">
          <div className="font-serif text-base sm:text-lg text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {submission.content}
          </div>
        </div>
      )}

      {/* Yuppsie + login prompt */}
      <div className="flex flex-col items-center gap-4 mt-10">
        <button
          onClick={handleYuppsie}
          disabled={isPending}
          className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] uppercase tracking-[0.15em] transition-all disabled:opacity-50 ${
            yuppsied
              ? "bg-foreground/10 text-foreground border border-foreground/20"
              : "text-muted border border-border/60 hover:border-foreground/30 hover:text-foreground"
          }`}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-transform ${yuppsied ? "fill-current" : ""} ${
              isPending ? "animate-pulse" : ""
            }`}
          />
          <span>{count} {count === 1 ? "Yuppsie" : "Yuppsies"}</span>
        </button>

        {loginPrompt && (
          <div className="bg-[#f8f5f0] border border-foreground/10 rounded-[2px] px-6 py-4 text-center shadow-sm">
            <p className="text-sm font-serif text-foreground/80 mb-3">
              Log in to give a Yuppsie.
            </p>
            <button
              onClick={() => { setLoginPrompt(false); login(); }}
              className="text-[10px] uppercase tracking-[0.2em] border border-foreground/20 px-4 py-2 rounded-[2px] hover:bg-foreground/5 transition-colors"
            >
              Continue with Google
            </button>
            <button
              onClick={() => setLoginPrompt(false)}
              className="ml-3 text-[10px] uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

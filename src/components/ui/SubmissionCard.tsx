"use client";

import { useState, useTransition, useEffect } from "react";
import { Heart, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/contexts/AuthContext";
import { toggleYuppsie } from "@/app/actions/yuppsies";
import Link from "next/link";

interface SubmissionCardProps {
  submission: any;
  priority?: boolean;
  initialYuppsied?: boolean;
}

export function SubmissionCard({ submission, priority, initialYuppsied = false }: SubmissionCardProps) {
  const { state, login } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [yuppsied, setYuppsied] = useState(initialYuppsied);

  useEffect(() => {
    setYuppsied(initialYuppsied);
  }, [initialYuppsied]);
  const [count, setCount] = useState(submission.yuppsiesCount ?? 0);
  const [isPending, startTransition] = useTransition();
  const [loginPrompt, setLoginPrompt] = useState(false);

  const isAuthenticated = state === "AUTHENTICATED";
  const authorDisplay = submission.anonymous ? "Anonymous" : submission.penName;
  const isArt = submission.type === "ART";

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

  const renderYuppsieButton = (className: string = "") => (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        onClick={handleYuppsie}
        disabled={isPending}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] uppercase tracking-[0.15em] transition-all disabled:opacity-50 ${
          yuppsied
            ? "bg-foreground/10 text-foreground border border-foreground/20"
            : "text-muted border border-border/60 hover:border-foreground/30 hover:text-foreground"
        }`}
      >
        <Heart
          className={`w-3 h-3 transition-transform active:scale-75 ${yuppsied ? "fill-current" : ""} ${isPending ? "animate-pulse" : ""}`}
        />
        <span>{count}</span>
      </button>

      {loginPrompt && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#f8f5f0] border border-foreground/10 rounded-[2px] px-4 py-3 text-center shadow-sm z-10"
        >
          <p className="text-xs font-serif text-foreground/70 mb-2">Log in to give a Yuppsie.</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => { setLoginPrompt(false); login(); }}
              className="text-[10px] uppercase tracking-[0.15em] border border-foreground/20 px-3 py-1 rounded-[2px] hover:bg-foreground/5 transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => setLoginPrompt(false)}
              className="text-[10px] uppercase tracking-[0.15em] text-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );

  return (
    <>
      <article className="group flex flex-col w-full max-w-3xl mx-auto mb-20 relative px-4 sm:px-0">

        {/* Separator */}
        <div className="w-full flex items-center justify-center mb-14 opacity-30">
          <div className="h-px flex-1 max-w-16 bg-foreground/30" />
          <span className="mx-4 text-foreground/40 text-[8px]">·</span>
          <div className="h-px flex-1 max-w-16 bg-foreground/30" />
        </div>

        {isArt ? (
          /* ART — Polaroid */
          <div className="flex flex-col items-center group/card rotate-[0.8deg] hover:rotate-0 transition-transform duration-500">
            <div
              className="relative cursor-zoom-in z-10 bg-card p-3 sm:p-4 pb-10 sm:pb-14 shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-[2px]"
              onClick={() => setIsModalOpen(true)}
            >
              <img
                src={submission.feedImageUrl || submission.fileUrl || submission.imageUrl}
                alt={submission.title}
                className="w-full h-auto max-h-[68vh] object-contain rounded-[1px]"
                loading={priority ? undefined : "lazy"}
                width={800}
                height={800}
              />
              <div className="absolute bottom-2 sm:bottom-3 left-0 right-0 text-center">
                <span className="font-serif italic text-[10px] sm:text-xs text-foreground/40 tracking-wider">
                  Day {submission.day} · {submission.prompt}
                </span>
              </div>
            </div>

            <div className="relative z-0 flex flex-col items-center text-center space-y-3 -mt-3 bg-[#f8f5f0] px-8 pt-7 pb-5 rounded-[2px] shadow-sm border border-foreground/10 w-11/12 max-w-sm">
              <h3 className="text-lg sm:text-xl font-serif tracking-wide text-foreground">
                {submission.title}
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-muted uppercase tracking-[0.2em] mb-1">
                <span>{authorDisplay}</span>
                <span className="text-foreground/20">·</span>
                <span>Day {submission.day}</span>
              </div>
              {renderYuppsieButton()}
            </div>
          </div>
        ) : (
          /* WRITING — parchment card */
          <div className="flex flex-col items-center max-w-2xl mx-auto w-full bg-[#f8f5f0] border border-foreground/5 rounded-[2px] p-7 sm:p-10 relative shadow-sm -rotate-[0.5deg] hover:rotate-0 transition-transform duration-500">
            <div className="flex flex-col items-center text-center space-y-3 mb-6 w-full">
              <h3 className="text-xl sm:text-2xl font-serif tracking-wide text-foreground">
                {submission.title}
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-muted uppercase tracking-[0.2em]">
                <span>{authorDisplay}</span>
                {submission.genre && (
                  <>
                    <span className="text-foreground/20">·</span>
                    <span>{submission.genre}</span>
                  </>
                )}
                <span className="text-foreground/20">·</span>
                <span>Day {submission.day}</span>
              </div>
            </div>

            <div className="w-full text-foreground/90 font-serif leading-relaxed text-sm sm:text-base whitespace-pre-wrap relative mb-5">
              <p className="line-clamp-5">{submission.content}</p>
              {submission.content && submission.content.length > 250 && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#f8f5f0] to-transparent pointer-events-none" />
              )}
            </div>

            <div className="flex flex-col items-center gap-4 mt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                className="font-serif italic text-xs text-muted hover:text-foreground transition-colors tracking-wider"
              >
                Read full piece →
              </button>
              {renderYuppsieButton()}
            </div>
          </div>
        )}
      </article>

      {/* Detail Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/30 backdrop-blur-[2px] overflow-y-auto"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="relative w-full max-w-4xl bg-[#f8f5f0] border border-foreground/10 rounded-[2px] overflow-hidden flex flex-col my-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-5 sm:p-7 border-b border-border/40">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif text-foreground">{submission.title}</h2>
                  <p className="text-[10px] text-muted uppercase tracking-[0.2em] mt-2">
                    {authorDisplay} · Day {submission.day}: {submission.prompt}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-muted hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[70vh]">
                {isArt ? (
                  <div className="w-full flex justify-center p-4 sm:p-8 bg-background/30">
                    <img
                      src={submission.detailImageUrl || submission.fileUrl || submission.imageUrl}
                      alt={submission.title}
                      className="max-w-full h-auto rounded-[2px]"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="p-6 sm:p-10 text-foreground/85 font-serif leading-relaxed text-sm sm:text-base whitespace-pre-wrap max-w-3xl mx-auto">
                    {submission.content}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border/40 flex justify-center">
                {renderYuppsieButton()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

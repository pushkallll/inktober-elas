"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronUp, Check, Save, Edit3, MessageSquare } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CloudinaryUpload } from "@/components/ui/CloudinaryUpload";
import { saveSubmission } from "./actions";
import { useRouter } from "next/navigation";


export interface Prompt {
  id: string;
  day: number;
  prompt: string;
}

export function SubmitForm({ prompts, initialData, userRole = "USER", moderationFeedback }: { prompts: Prompt[], initialData?: any, userRole?: string, moderationFeedback?: any }) {
  const [type, setType] = useState<"ART" | "WRITING" | null>(initialData?.category || null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");

  const [day, setDay] = useState<number>(initialData?.day || (prompts.length > 0 ? prompts[0].day : 0));
  const [title, setTitle] = useState(initialData?.title || "");
  const [anonymous, setAnonymous] = useState(initialData?.anonymous || false);

  // Writing specific
  const [genre, setGenre] = useState(initialData?.genre || "Poetry");
  const [writingContent, setWritingContent] = useState(initialData?.writing_content || "");

  // Art specific
  const [cloudinaryInfo, setCloudinaryInfo] = useState<any>(initialData ? {
    public_id: initialData.cloudinary_public_id,
    secure_url: initialData.cloudinary_url,
    width: initialData.cloudinary_width,
    height: initialData.cloudinary_height,
    format: initialData.cloudinary_format
  } : null);

  const router = useRouter();

  const currentPrompt = prompts.find(p => p.day === day);

  const [overrideUserId, setOverrideUserId] = useState(initialData?.user_id || "");

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    if (!currentPrompt) {
      setError("No active prompt for the selected day.");
      return;
    }

    if (type === "ART" && !cloudinaryInfo?.secure_url) {
      setError("Please upload your artwork before submitting.");
      return;
    }

    if (type === "WRITING" && !writingContent.trim()) {
      setError("Please write your piece before submitting.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    setStatusText(isDraft ? "Saving Draft..." : "Submitting Entry...");

    try {
      // Build payload for the Server Action.
      // user_id and status are resolved server-side — never trusted from the client.
      const payload: Parameters<typeof saveSubmission>[0] = {
        submissionId: initialData?.id,          // undefined for new submissions
        day: currentPrompt.day,
        promptId: currentPrompt.id,
        category: type!,
        title,
        anonymous,
        isDraft,
        overrideUserId: userRole === "ADMIN" ? overrideUserId.trim() : undefined,
      };

      if (type === "WRITING") {
        payload.genre = genre;
        payload.writingContent = writingContent;
      } else {
        // For ART: send Cloudinary info from the current state.
        // If reopening an existing draft with no new upload, cloudinaryInfo was
        // pre-populated from initialData — pass it through so the server keeps it.
        payload.cloudinaryPublicId = cloudinaryInfo?.public_id ?? undefined;
        payload.cloudinaryUrl = cloudinaryInfo?.secure_url ?? undefined;
        payload.cloudinaryWidth = cloudinaryInfo?.width ?? undefined;
        payload.cloudinaryHeight = cloudinaryInfo?.height ?? undefined;
        payload.cloudinaryFormat = cloudinaryInfo?.format ?? undefined;
        payload.cloudinaryMetadata = cloudinaryInfo?.width
          ? JSON.stringify(cloudinaryInfo)
          : (initialData?.cloudinary_metadata ?? undefined);
      }

      const result = await saveSubmission(payload);

      if (!result.success) {
        throw new Error("An unexpected error occurred.");
      }

      // Success
      router.push("/my-submissions");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
      setStatusText("");
    }
  };



  if (prompts.length === 0) {
    return (
      <div className="text-center p-12 bg-white/40 border border-foreground/10 rounded-[2px]">
        <h3 className="font-serif text-lg text-foreground">No Active Prompts</h3>
        <p className="text-sm text-muted mt-2">Come back later when a prompt is revealed.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#f8f5f0]/95 backdrop-blur-[2px] border border-foreground/10 shadow-[0_4px_24px_rgba(0,0,0,0.05)] rounded-[2px] p-6 sm:p-12 relative">


      {!type ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={() => setType("ART")}
            className="flex flex-col items-center justify-center p-12 border border-foreground/10 hover:border-foreground/30 bg-white/40 transition-colors group rounded-[2px]"
          >
            <div className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center mb-4 group-hover:bg-foreground group-hover:text-background group-hover:border-foreground transition-all">
              <span className="font-serif text-lg leading-none">+</span>
            </div>
            <h3 className="font-serif tracking-widest uppercase text-foreground">Art</h3>
            <p className="text-xs text-muted mt-2 uppercase tracking-[0.1em]">Upload image</p>
          </button>

          <button
            onClick={() => setType("WRITING")}
            className="flex flex-col items-center justify-center p-12 border border-foreground/10 hover:border-foreground/30 bg-white/40 transition-colors group rounded-[2px]"
          >
            <div className="w-10 h-10 rounded-full border border-foreground/20 flex items-center justify-center mb-4 group-hover:bg-foreground group-hover:text-background group-hover:border-foreground transition-all">
              <span className="font-serif text-lg leading-none">+</span>
            </div>
            <h3 className="font-serif tracking-widest uppercase text-foreground">Writing</h3>
            <p className="text-xs text-muted mt-2 uppercase tracking-[0.1em]">Write or paste text</p>
          </button>
        </div>
      ) : (
        <form className="flex flex-col space-y-8" onSubmit={(e) => handleSubmit(e, false)}>

          <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
            <h2 className="font-serif uppercase tracking-widest text-foreground text-sm sm:text-base">
              {type === "ART" ? "Submit Artwork" : "Submit Writing"}
            </h2>
            <button type="button" onClick={() => setType(null)} className="text-muted hover:text-foreground transition-colors p-1" aria-label="Cancel">
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-700 text-sm p-4 rounded-[2px]">
              {error}
            </div>
          )}

          {/* Moderation Feedback Panel */}
          {moderationFeedback && (
            <div className="bg-orange-50 border border-orange-200 p-6 rounded-[2px]">
              <h3 className="text-orange-900 font-serif font-bold text-lg mb-3 flex items-center gap-2">
                <Edit3 className="w-5 h-5" /> Revision Requested
              </h3>
              {moderationFeedback.reason && (
                <p className="text-orange-800 text-sm mb-4 leading-relaxed bg-white/50 p-3 rounded-[2px]">
                  {moderationFeedback.reason}
                </p>
              )}

              {moderationFeedback.moderation_feedback && moderationFeedback.moderation_feedback.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs uppercase tracking-wider text-orange-900/70 font-bold mb-1">Specific Feedback</h4>
                  {moderationFeedback.moderation_feedback.map((fb: any, idx: number) => (
                    <div key={idx} className="bg-white border border-orange-200 p-4 rounded-[2px] text-sm">
                      <div className="text-[10px] text-orange-600/70 uppercase tracking-wider mb-1">
                        Highlighted Text
                      </div>
                      <p className="font-serif italic text-orange-900 bg-orange-50/50 p-2 mb-2 rounded-[1px] border-l-2 border-orange-300">
                        &ldquo;{fb.selected_text}&rdquo;
                      </p>
                      <div className="flex gap-2 items-start text-orange-800">
                        <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 opacity-70" />
                        <p>{fb.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Day Selection */}
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-foreground/70 font-sans">Day</label>
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="bg-white/60 border border-foreground/10 rounded-[2px] p-3 text-foreground focus:outline-none focus:border-foreground/40 focus:bg-white/80 transition-all font-serif appearance-none cursor-pointer"
              >
                {prompts.map((p) => (
                  <option key={p.id} value={p.day}>Day {p.day}</option>
                ))}
              </select>
            </div>

            {/* Prompt Display */}
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-foreground/70 font-sans">Official Prompt</label>
              <div className="bg-foreground/5 border border-foreground/10 rounded-[2px] p-3 text-foreground font-serif text-lg flex items-center h-[50px] overflow-hidden">
                {currentPrompt?.prompt}
              </div>
            </div>
          </div>

          {/* Admin Publish on Behalf */}
          {userRole === "ADMIN" && (
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-[2px]">
              <label className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-orange-900 font-sans font-bold flex items-center gap-2 mb-2">
                Admin: Publish on Behalf of User
              </label>
              <input
                type="text"
                value={overrideUserId}
                onChange={(e) => setOverrideUserId(e.target.value)}
                className="w-full bg-white border border-orange-200 rounded-[2px] p-3 text-sm text-foreground focus:outline-none focus:border-orange-400 transition-all"
                placeholder="Enter User ID (Leave blank for yourself)"
              />
              <p className="text-[10px] text-orange-800 mt-1 uppercase tracking-wider">Leave this empty unless publishing for someone else.</p>
            </div>
          )}

          {/* Title Input */}
          <div className="flex flex-col space-y-2">
            <label className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-foreground/70 font-sans">Title</label>
            <input
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/60 border border-foreground/10 rounded-[2px] p-3.5 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-foreground/40 focus:bg-white/80 transition-all font-serif text-lg"
              placeholder="Give your piece a title..."
            />
          </div>

          {/* Content Area */}
          {type === "ART" ? (
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-foreground/70 font-sans">Artwork</label>
              {!cloudinaryInfo ? (
                <CloudinaryUpload
                  onUploadSuccess={(info) => {
                    setCloudinaryInfo(info);
                    setError("");
                  }}
                  onUploadError={(err) => setError(err)}
                  disabled={isSubmitting}
                />
              ) : (
                <div className="border border-foreground/20 bg-white/50 rounded-[2px] p-4 flex flex-col items-center">
                  <div className="w-full relative aspect-video bg-black/5 rounded-[2px] overflow-hidden mb-4 flex items-center justify-center">
                    <img src={cloudinaryInfo.secure_url} alt="Uploaded preview" className="max-h-full object-contain" />
                  </div>
                  <div className="flex w-full justify-between items-center text-xs text-muted uppercase tracking-wider">
                    <span className="flex items-center text-green-700 bg-green-500/10 px-2 py-1 rounded-[2px]"><Check className="w-3 h-3 mr-1" /> Ready</span>
                    <button type="button" onClick={() => setCloudinaryInfo(null)} className="hover:text-red-600 transition-colors" disabled={isSubmitting}>Remove</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-col space-y-2">
                <label className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-foreground/70 font-sans">Genre</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="bg-white/60 border border-foreground/10 rounded-[2px] p-3 text-foreground focus:outline-none focus:border-foreground/40 focus:bg-white/80 transition-all font-serif appearance-none cursor-pointer"
                >
                  <option value="Poetry">Poetry</option>
                  <option value="Prose">Prose</option>
                  <option value="Short Story">Short Story</option>
                  <option value="Essay">Essay</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-foreground/70 font-sans">Content</label>
                <textarea
                  required={!isSubmitting}
                  rows={12}
                  maxLength={50000}
                  value={writingContent}
                  onChange={(e) => setWritingContent(e.target.value)}
                  className="bg-white/60 border border-foreground/10 rounded-[2px] p-4 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-foreground/40 focus:bg-white/80 transition-all font-serif text-base resize-y leading-relaxed whitespace-pre-wrap"
                  placeholder="Write your piece here..."
                />
              </div>
            </>
          )}

          {/* Checkbox */}
          <div className="flex items-center space-x-3 pt-2">
            <label className="flex items-center cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-4 h-4 border border-foreground/30 rounded-[1px] peer-checked:bg-foreground peer-checked:border-foreground transition-colors group-hover:border-foreground/60"></div>
                <svg className="absolute w-3 h-3 text-background pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span className="ml-3 text-sm text-foreground/90 font-serif group-hover:text-foreground transition-colors">Submit anonymously</span>
            </label>
          </div>

          {/* Guidelines */}
          <div className="border border-foreground/10 rounded-[2px] bg-white/20 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowGuidelines(!showGuidelines)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs uppercase tracking-[0.15em] text-foreground/70 hover:text-foreground hover:bg-white/40 transition-colors font-sans"
            >
              <span>Community Guidelines (V1.0 Accepted)</span>
              {showGuidelines ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <AnimatePresence>
              {showGuidelines && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1 text-sm text-muted font-serif leading-relaxed">
                    <p className="mb-2">We ask that all submissions follow the campus guidelines for creativity and respect. Please ensure your work is original and does not violate copyright laws.</p>
                    <p>Do not submit explicit, hateful, or harassing content. The ELAS and Inktober team reserves the right to remove submissions that do not adhere to these standards.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isSubmitting}
              className="flex-1 bg-white border border-foreground/20 text-foreground py-4 rounded-[2px] font-sans uppercase tracking-[0.2em] text-xs hover:bg-black/5 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] bg-[#2d241e] text-[#f8f5f0] py-4 rounded-[2px] font-sans uppercase tracking-[0.2em] text-xs hover:bg-[#1a1511] active:scale-[0.99] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (statusText || "Processing...") : "Submit for Review"}
            </button>
          </div>

        </form>
      )}
    </div>
  );
}

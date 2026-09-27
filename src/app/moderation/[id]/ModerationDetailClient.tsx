"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { Check, X, Edit3, Image as ImageIcon, MessageSquare, Highlighter } from "lucide-react";
import { moderateSubmission } from "../actions";
import { useRouter } from "next/navigation";

interface Highlight {
  id: string;
  start: number;
  end: number;
  text: string;
  comment: string;
  guidelineId: string;
}

export function ModerationDetailClient({ submission, guidelines, history }: { submission: any, guidelines: any[], history: any[] }) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [overallFeedback, setOverallFeedback] = useState("");
  const [selectedGuideline, setSelectedGuideline] = useState<string>("");

  // Highlight state
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [pendingSelection, setPendingSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  const [highlightComment, setHighlightComment] = useState("");
  const [highlightGuideline, setHighlightGuideline] = useState("");
  const [highlightMode, setHighlightMode] = useState(false);

  const handleAction = async (action: "APPROVED" | "REVISION_REQUESTED" | "REJECTED") => {
    if ((action === "REVISION_REQUESTED" || action === "REJECTED") && !overallFeedback && highlights.length === 0) {
      alert("Please provide feedback or highlight an issue before requesting revision or rejection.");
      return;
    }
    try {
      setProcessing(true);
      await moderateSubmission(
        submission.id,
        action,
        overallFeedback,
        selectedGuideline,
        highlights
      );
      router.push("/moderation");
    } catch (e) {
      console.error(e);
      alert("Failed to perform action. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Calculate character offset from the start of the writing-content div.
   * Uses the pre-caret range technique which is accurate for plain text nodes.
   */
  const getCharOffset = useCallback((container: Element, node: Node, offset: number): number => {
    const range = document.createRange();
    range.selectNodeContents(container);
    range.setEnd(node, offset);
    return range.toString().length;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!highlightMode) return;
    if (submission.category !== "WRITING") return;

    const selObj = window.getSelection();
    if (!selObj || selObj.isCollapsed || selObj.rangeCount === 0) return;

    const range = selObj.getRangeAt(0);
    const contentDiv = document.getElementById("writing-content");
    if (!contentDiv || !contentDiv.contains(range.commonAncestorContainer)) return;

    const start = getCharOffset(contentDiv, range.startContainer, range.startOffset);
    const text = range.toString();
    if (text.length === 0) return;

    const end = start + text.length;

    // Validate bounds
    const fullText = submission.writing_content || "";
    if (start < 0 || end > fullText.length || start >= end) return;
    if (fullText.substring(start, end) !== text) {
      // Offset mismatch — text nodes are complex; ignore
      return;
    }

    setPendingSelection({ start, end, text });
    // Don't clear browser selection yet — user might adjust
  }, [highlightMode, submission, getCharOffset]);

  const confirmHighlight = () => {
    if (!pendingSelection || !highlightComment.trim()) return;

    // Check for exact overlaps with existing highlights
    const overlaps = highlights.some(
      h => pendingSelection.start < h.end && pendingSelection.end > h.start
    );
    if (overlaps) {
      alert("This selection overlaps an existing highlight. Please choose a non-overlapping range.");
      return;
    }

    setHighlights(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        start: pendingSelection.start,
        end: pendingSelection.end,
        text: pendingSelection.text,
        comment: highlightComment.trim(),
        guidelineId: highlightGuideline,
      },
    ]);
    setPendingSelection(null);
    setHighlightComment("");
    setHighlightGuideline("");
    window.getSelection()?.removeAllRanges();
  };

  const cancelHighlight = () => {
    setPendingSelection(null);
    setHighlightComment("");
    setHighlightGuideline("");
    window.getSelection()?.removeAllRanges();
  };

  const removeHighlight = (id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
  };

  /**
   * Render writing text with non-overlapping highlight marks applied by offset.
   */
  const renderHighlightedText = () => {
    const text = submission.writing_content || "";
    if (highlights.length === 0) return text;

    const sorted = [...highlights].sort((a, b) => a.start - b.start);
    const parts: React.ReactNode[] = [];
    let cursor = 0;

    for (const hl of sorted) {
      if (hl.start > cursor) {
        parts.push(<span key={`t-${cursor}`}>{text.slice(cursor, hl.start)}</span>);
      }
      parts.push(
        <mark
          key={`hl-${hl.id}`}
          title={hl.comment}
          className="bg-amber-200 text-amber-900 rounded-sm px-0.5 cursor-help"
        >
          {text.slice(hl.start, hl.end)}
        </mark>
      );
      cursor = hl.end;
    }

    if (cursor < text.length) {
      parts.push(<span key="t-end">{text.slice(cursor)}</span>);
    }

    return parts;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Left: Submission Content */}
      <div className="flex-1 bg-white/70 border border-foreground/10 p-6 sm:p-10 rounded-[2px] shadow-sm">

        {/* Metadata */}
        <div className="mb-8 border-b border-foreground/10 pb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-xs uppercase tracking-[0.1em] px-2 py-1 rounded-[2px] font-bold ${
              submission.category === 'ART' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {submission.category} {submission.genre ? `· ${submission.genre}` : ''}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-1 bg-foreground/5 rounded-[2px] font-bold">
              {submission.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-muted uppercase tracking-wider ml-auto">
              Day {submission.day} · {submission.prompts?.prompt}
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-2">{submission.title}</h1>
          <div className="text-xs text-muted uppercase tracking-widest">
            <span>By: {submission.users?.pen_name}</span>
            {submission.anonymous && <span className="mx-2 text-orange-700 font-bold">[Requested Anonymity]</span>}
            <span className="mx-2">·</span>
            <span>Real Account ID: <span className="font-mono lowercase text-[10px]">{submission.user_id}</span></span>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white border border-foreground/5 p-6 rounded-[2px] min-h-[400px]">
          {submission.category === "ART" ? (
            <div className="flex flex-col items-center">
              {submission.cloudinary_url ? (
                <img
                  src={submission.cloudinary_url}
                  alt={submission.title}
                  className="w-full max-w-3xl object-contain rounded-[2px]"
                />
              ) : (
                <div className="p-12 text-muted flex flex-col items-center">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                  <span>No image provided</span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Highlight mode toolbar */}
              {submission.category === "WRITING" && (
                <div className="mb-4 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setHighlightMode(m => !m);
                      if (highlightMode) {
                        setPendingSelection(null);
                        window.getSelection()?.removeAllRanges();
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-[2px] text-[10px] uppercase tracking-[0.15em] font-bold transition-colors border ${
                      highlightMode
                        ? "bg-amber-600 text-white border-amber-700"
                        : "bg-foreground/5 text-foreground/70 border-foreground/10 hover:bg-foreground/10"
                    }`}
                  >
                    <Highlighter className="w-3.5 h-3.5" />
                    {highlightMode ? "Highlight Mode ON" : "Highlight ✎"}
                  </button>
                  {highlightMode && (
                    <span className="text-[10px] text-muted italic">
                      Select text in the passage below, then add a comment.
                    </span>
                  )}
                </div>
              )}

              {/* Writing text — selectable when in highlight mode */}
              <div
                id="writing-content"
                onMouseUp={handleMouseUp}
                className={`font-serif text-lg text-foreground whitespace-pre-wrap leading-relaxed ${
                  highlightMode ? "selection:bg-amber-200 selection:text-amber-900 cursor-text" : ""
                }`}
              >
                {renderHighlightedText()}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Moderation Tools */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6">

        {/* Pending selection confirmation panel */}
        {submission.category === "WRITING" && pendingSelection && (
          <div className="bg-amber-50 border border-amber-300 p-4 rounded-[2px] shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Highlighter className="w-4 h-4 text-amber-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800">New Annotation</h4>
            </div>

            {/* Preview of selected text */}
            <div className="text-sm font-serif italic text-amber-900 bg-amber-100 border border-amber-200 p-3 rounded-[2px] mb-3 whitespace-pre-wrap line-clamp-4">
              &ldquo;{pendingSelection.text}&rdquo;
            </div>
            <div className="text-[10px] text-amber-700 mb-3 uppercase tracking-wider">
              Chars {pendingSelection.start}–{pendingSelection.end} ({pendingSelection.end - pendingSelection.start} chars)
            </div>

            <textarea
              value={highlightComment}
              onChange={e => setHighlightComment(e.target.value)}
              placeholder="Why is this passage flagged? (required)"
              className="w-full bg-white border border-amber-300 p-2 text-sm rounded-[2px] mb-3 focus:outline-none focus:ring-1 focus:ring-amber-500"
              rows={3}
              autoFocus
            />

            <select
              value={highlightGuideline}
              onChange={e => setHighlightGuideline(e.target.value)}
              className="w-full bg-white border border-amber-300 p-2 text-sm rounded-[2px] mb-3 focus:outline-none"
            >
              <option value="">No specific guideline (optional)</option>
              {guidelines.map(g => (
                <option key={g.id} value={g.id}>V{g.version}: {g.title}</option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={confirmHighlight}
                disabled={!highlightComment.trim()}
                className="flex-1 flex items-center justify-center gap-1 bg-amber-600 text-white text-xs font-bold uppercase py-2 rounded-[2px] hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Confirm
              </button>
              <button
                onClick={cancelHighlight}
                className="px-4 bg-amber-100 text-amber-800 text-xs font-bold uppercase py-2 rounded-[2px] hover:bg-amber-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Saved highlights */}
        {highlights.length > 0 && (
          <div className="bg-white/70 border border-foreground/10 p-4 rounded-[2px]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">
              Annotated Passages ({highlights.length})
            </h4>
            <div className="flex flex-col gap-3">
              {highlights.map((hl, i) => (
                <div key={hl.id} className="bg-white border border-foreground/5 p-3 rounded-[2px] text-sm relative">
                  <button
                    onClick={() => removeHighlight(hl.id)}
                    className="absolute top-2 right-2 text-muted hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="text-[9px] uppercase tracking-wider text-amber-700 mb-1">
                    #{i + 1} · chars {hl.start}–{hl.end}
                  </div>
                  <p className="font-serif italic text-muted mb-2 pr-6 text-xs line-clamp-2">&ldquo;{hl.text}&rdquo;</p>
                  <div className="flex gap-2 items-start text-foreground">
                    <MessageSquare className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
                    <p className="text-xs">{hl.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decision Panel */}
        <div className="bg-white/70 border border-foreground/10 p-6 rounded-[2px] shadow-sm flex flex-col gap-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Moderation Decision</h4>

          <textarea
            value={overallFeedback}
            onChange={e => setOverallFeedback(e.target.value)}
            placeholder="Overall feedback (required for revision/rejection)..."
            className="w-full bg-white border border-foreground/10 p-3 text-sm rounded-[2px] focus:outline-none min-h-[100px]"
          />

          <select
            value={selectedGuideline}
            onChange={e => setSelectedGuideline(e.target.value)}
            className="w-full bg-white border border-foreground/10 p-3 text-sm rounded-[2px] focus:outline-none"
          >
            <option value="">Select Guideline (Optional)</option>
            {guidelines.map(g => (
              <option key={g.id} value={g.id}>V{g.version}: {g.title}</option>
            ))}
          </select>

          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={() => handleAction("APPROVED")}
              disabled={processing || submission.status === "APPROVED"}
              className="px-4 py-3 flex items-center justify-center gap-2 text-green-700 bg-green-500/10 hover:bg-green-500/20 rounded-[2px] transition-colors disabled:opacity-50 text-xs uppercase tracking-wider font-bold"
            >
              <Check className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => handleAction("REVISION_REQUESTED")}
              disabled={processing || (!overallFeedback.trim() && highlights.length === 0)}
              className="px-4 py-3 flex items-center justify-center gap-2 text-orange-700 bg-orange-500/10 hover:bg-orange-500/20 rounded-[2px] transition-colors disabled:opacity-50 text-xs uppercase tracking-wider font-bold"
            >
              <Edit3 className="w-4 h-4" />
              Request Revision
            </button>
            <button
              onClick={() => handleAction("REJECTED")}
              disabled={processing || (!overallFeedback.trim() && highlights.length === 0) || submission.status === "REJECTED"}
              className="px-4 py-3 flex items-center justify-center gap-2 text-red-700 bg-red-500/10 hover:bg-red-500/20 rounded-[2px] transition-colors disabled:opacity-50 text-xs uppercase tracking-wider font-bold"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white/40 border border-foreground/10 p-6 rounded-[2px]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">Internal History</h4>
            <div className="flex flex-col gap-4">
              {history.map(item => (
                <div key={item.id} className="text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs uppercase">{item.action.replace('_', ' ')}</span>
                    <span className="text-[10px] text-muted">{format(new Date(item.created_at), "MMM d, h:mm a")}</span>
                  </div>
                  <div className="text-xs text-muted mb-1">By {item.actor?.pen_name}</div>
                  {item.reason && <p className="text-foreground/80 bg-white/50 p-2 rounded-[2px] mt-2 text-xs">{item.reason}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

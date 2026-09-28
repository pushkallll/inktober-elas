"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";

const TABS = ["PENDING_REVIEW", "REVISION_REQUESTED", "APPROVED", "REJECTED", "DELETED"];

export function ModerationQueueClient({ initialSubmissions, currentStatus }: { initialSubmissions: any[], currentStatus: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-foreground/10 pb-2">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => router.push(`/moderation?status=${tab}`)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-[2px] transition-colors ${
              currentStatus === tab
                ? "bg-foreground text-background"
                : "bg-transparent text-foreground/60 hover:bg-black/5"
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Queue */}
      {initialSubmissions.length === 0 ? (
        <div className="bg-white/40 border border-foreground/10 p-12 text-center rounded-[2px]">
          <p className="text-foreground/60 font-serif text-lg">The queue is empty.</p>
          <p className="text-xs text-muted uppercase tracking-wider mt-4">No submissions found for this status.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {initialSubmissions.map(sub => (
            <div
              key={sub.id}
              onClick={() => router.push(`/moderation/${sub.id}`)}
              className="bg-white/70 hover:bg-white/90 cursor-pointer border border-foreground/10 p-4 rounded-[2px] shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] uppercase tracking-[0.1em] px-2 py-0.5 rounded-[2px] font-bold ${
                    sub.category === 'ART' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                  }`}>
                    {sub.category}
                  </span>
                  <span className="text-[10px] text-muted uppercase tracking-wider">
                    Day {sub.day} · {sub.prompts?.prompt}
                  </span>
                </div>
                <h3 className="font-serif text-lg text-foreground leading-tight">{sub.title}</h3>
                <div className="text-[10px] text-muted uppercase tracking-widest mt-1">
                  <span>By: {sub.users?.pen_name} {sub.anonymous && "[Anon]"}</span>
                  <span className="mx-2">·</span>
                  <span>{format(new Date(sub.created_at), "MMM d, h:mm a")}</span>
                </div>
              </div>
              <div className="text-[10px] uppercase tracking-[0.1em] font-bold px-3 py-1 bg-foreground/5 rounded-[2px]">
                {sub.status.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

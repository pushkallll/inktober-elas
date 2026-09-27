"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Check, X } from "lucide-react";
import { processAppeal } from "../actions";

export function AppealsClient({ appeals }: { appeals: any[] }) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleProcess = async (appealId: string, decision: "ACCEPTED" | "DENIED") => {
    const reason = prompt(`Enter reason for ${decision} (Internal record):`);
    if (reason === null) return;

    try {
      setProcessingId(appealId);
      await processAppeal(appealId, decision, reason);
    } catch (e: any) {
      alert(e.message || "Failed to process appeal");
    } finally {
      setProcessingId(null);
    }
  };

  if (appeals.length === 0) {
    return (
      <div className="text-center p-12 bg-white/40 border border-foreground/10 rounded-[2px]">
        <p className="text-sm text-muted">No appeals in the queue.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {appeals.map(appeal => (
        <div key={appeal.id} className="bg-white border border-foreground/10 p-4 rounded-[2px] shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-[2px] ${
                appeal.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                appeal.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                appeal.status === 'DENIED' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {appeal.status}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted font-bold">
                {appeal.appeal_type} Appeal
              </span>
              <span className="text-[10px] text-muted">
                {format(new Date(appeal.submitted_at), "MMM d, h:mm a")}
              </span>
            </div>
            
            <p className="text-sm font-serif text-foreground/90 mb-2">
              <strong>User:</strong> {appeal.users?.pen_name} ({appeal.user_id})
            </p>
            {appeal.target_id && appeal.target_id !== appeal.user_id && (
              <p className="text-xs text-muted mb-2 font-mono">
                Target: {appeal.target_id}
              </p>
            )}
            
            <div className="bg-orange-50 border border-orange-100 p-3 rounded-[2px]">
              <p className="text-sm text-orange-900 font-serif whitespace-pre-wrap">
                "{appeal.appeal_text}"
              </p>
            </div>

            {appeal.decision_reason && (
              <div className="mt-3 text-xs text-muted">
                <span className="uppercase font-bold tracking-wider mr-2">Decision Reason:</span>
                {appeal.decision_reason}
              </div>
            )}
          </div>
          
          {appeal.status === 'PENDING' && (
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => handleProcess(appeal.id, "ACCEPTED")}
                disabled={processingId === appeal.id}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-700 hover:bg-green-500/20 text-xs font-bold uppercase rounded-[2px] transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Accept
              </button>
              <button
                onClick={() => handleProcess(appeal.id, "DENIED")}
                disabled={processingId === appeal.id}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-700 hover:bg-red-500/20 text-xs font-bold uppercase rounded-[2px] transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" /> Deny
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

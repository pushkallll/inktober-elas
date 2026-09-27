"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteMySubmission } from "@/app/actions/submissions";

export function DeleteSubmissionButton({ submissionId }: { submissionId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this submission?")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMySubmission(submissionId);
      // The server action will call revalidatePath, which refreshes the UI automatically without a browser reload.
    } catch (error) {
      console.error("Failed to delete submission", error);
      alert("Failed to delete submission. Please try again.");
      setIsDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex-1 sm:flex-none flex items-center justify-center p-3 text-red-500/70 hover:text-red-600 hover:bg-red-500/10 rounded-[2px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Delete Submission"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

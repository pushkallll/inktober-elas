import { createPublicClient } from "@/lib/supabase/public";
import { notFound } from "next/navigation";
import { getOptimizedCloudinaryUrl } from "@/lib/image-utils";
import { PublicSubmissionClient } from "./PublicSubmissionClient";

export const dynamic = "force-dynamic";

export default async function PublicSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createPublicClient();

  // Only serve APPROVED submissions
  const { data: submission, error } = await supabase
    .from("submissions")
    .select(`
      id,
      category,
      genre,
      title,
      writing_content,
      cloudinary_url,
      anonymous,
      day,
      status,
      created_at,
      users!submissions_user_id_fkey ( pen_name ),
      prompts ( prompt ),
      yuppsies ( count )
    `)
    .eq("id", id)
    .eq("status", "APPROVED")
    .single();

  if (error || !submission) {
    notFound();
  }

  const authorDisplay = submission.anonymous ? "Anonymous" : (submission.users as any)?.pen_name || "Unknown";
  const prompt = (submission.prompts as any)?.prompt || "";
  const yuppsiesCount = (submission.yuppsies as any)?.[0]?.count ?? 0;

  const feedImageUrl = getOptimizedCloudinaryUrl(submission.cloudinary_url, "detail");

  return (
    <PublicSubmissionClient
      submission={{
        id: submission.id,
        category: submission.category,
        genre: submission.genre,
        title: submission.title,
        content: submission.writing_content || "",
        imageUrl: feedImageUrl || submission.cloudinary_url || "",
        authorDisplay,
        day: submission.day,
        prompt,
        yuppsiesCount,
        anonymous: submission.anonymous,
      }}
    />
  );
}

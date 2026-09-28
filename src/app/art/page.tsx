import { createPublicClient } from "@/lib/supabase/public";
import { ArtClient } from "./ArtClient";
import { getOptimizedCloudinaryUrl } from "@/lib/image-utils";

export const revalidate = 60;

export default async function ArtPage() {
  const supabase = createPublicClient();

  const { data: submissions } = await supabase
    .from("submissions")
    .select(`
      id,
      category,
      title,
      anonymous,
      day,
      cloudinary_url,
      created_at,
      users!submissions_user_id_fkey ( pen_name ),
      prompts ( prompt ),
      yuppsies ( count )
    `)
    .eq("category", "ART")
    .eq("status", "APPROVED")
    .order("created_at", { ascending: false })
    .limit(50);

  const formattedSubmissions = (submissions || []).map(sub => ({
    id: sub.id,
    type: sub.category,
    title: sub.title,
    penName: (sub.users as any)?.pen_name || "Unknown",
    anonymous: sub.anonymous,
    day: sub.day,
    prompt: (sub.prompts as any)?.prompt || "",
    feedImageUrl: getOptimizedCloudinaryUrl(sub.cloudinary_url, 'feed'),
    detailImageUrl: getOptimizedCloudinaryUrl(sub.cloudinary_url, 'detail'),
    timestamp: new Date(sub.created_at).getTime(),
    yuppsiesCount: (sub.yuppsies as any)?.[0]?.count ?? 0,
  }));

  return <ArtClient initialSubmissions={formattedSubmissions} />;
}

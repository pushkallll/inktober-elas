import { createPublicClient } from "@/lib/supabase/public";
import { HomeClient } from "./HomeClient";
import { getOptimizedCloudinaryUrl } from "@/lib/image-utils";

export const revalidate = 60; // Cache for 60 seconds (ISR)

export default async function Home() {
  const supabase = createPublicClient();
  
  const { data: submissions } = await supabase
    .from("submissions")
    .select(`
      id,
      category,
      title,
      anonymous,
      day,
      genre,
      writing_content,
      cloudinary_url,
      created_at,
      users!submissions_user_id_fkey ( pen_name ),
      prompts ( prompt ),
      yuppsies ( count )
    `)
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
    genre: sub.genre || "Prose",
    content: sub.writing_content || "",
    feedImageUrl: getOptimizedCloudinaryUrl(sub.cloudinary_url, 'feed'),
    detailImageUrl: getOptimizedCloudinaryUrl(sub.cloudinary_url, 'detail'),
    timestamp: new Date(sub.created_at).getTime(),
    yuppsiesCount: (sub.yuppsies as any)?.[0]?.count ?? 0,
  }));

  return <HomeClient initialSubmissions={formattedSubmissions} />;
}

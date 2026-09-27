import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check campus domain
    const email = user.email || "";
    const campusDomain = process.env.NEXT_PUBLIC_CAMPUS_EMAIL_DOMAIN || "hyderabad.bits-pilani.ac.in";
    if (!email.endsWith(`@${campusDomain}`)) {
      return NextResponse.json({ error: "Unauthorized domain" }, { status: 403 });
    }

    // Verify user is ACTIVE
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("status")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.status !== "ACTIVE") {
      return NextResponse.json({ error: "Account not active" }, { status: 403 });
    }

    const body = await request.json();
    const { paramsToSign } = body;

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({ signature });
  } catch (error) {
    console.error("Cloudinary sign error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

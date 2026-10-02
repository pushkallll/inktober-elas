import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { InteractiveBanner } from "@/components/banner/InteractiveBanner";
import { TopNav } from "@/components/navigation/TopNav";
import { createPublicClient } from "@/lib/supabase/public";
import { unstable_cache } from "next/cache";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

import { AuthProvider } from "@/lib/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Inktober 2026 × ELAS",
  description: "A cozy digital exhibition of campus art and writing.",
};

const getCachedPrompt = unstable_cache(
  async (year: number, day: number) => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("prompts")
      .select("prompt")
      .eq("day", day)
      .single();
    return data?.prompt || null;
  },
  ['inktober-prompt-query'], // Next.js appends arguments (year, day) to form the full key
  {
    revalidate: 86400, // 24 hours (a day's prompt never changes)
    tags: ['prompts']
  }
);

async function getBannerText() {
  const now = new Date();
  
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === "year")?.value || "0", 10);
  const month = parseInt(parts.find(p => p.type === "month")?.value || "0", 10);
  const day = parseInt(parts.find(p => p.type === "day")?.value || "0", 10);

  // In "en-US", month is 1-12. October is 10.
  if (year !== 2026 || month !== 10 || day < 1 || day > 31) {
    return "INKTOBER 2026 × ELAS · ART & WRITING · ";
  }

  // Next.js explicitly includes the function arguments (year, day) in the cache key
  const promptText = await getCachedPrompt(year, day);

  let bannerText = "INKTOBER 2026 × ELAS · ART & WRITING · ";
  if (promptText) {
    bannerText = `INKTOBER 2026 × ELAS · DAY ${day.toString().padStart(2, '0')} · ${promptText.toUpperCase()} · `;
  }

  console.log("BANNER DEBUG", { year, day, prompt: promptText, bannerText });
  return bannerText;
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const bannerText = await getBannerText();

  // DEBUGGING: Log to terminal
  console.log("BANNER DEBUG", { 
    bannerText 
  });

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>

          <div className="relative z-10 flex flex-col min-h-full">
            <TopNav />
            <InteractiveBanner text={bannerText} />
            <main className="flex-1 flex flex-col w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 md:mb-0">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

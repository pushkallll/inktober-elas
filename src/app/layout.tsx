import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { InteractiveBanner } from "@/components/banner/InteractiveBanner";
import { TopNav } from "@/components/navigation/TopNav";

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>

          <div className="relative z-10 flex flex-col min-h-full">
            <TopNav />
            <InteractiveBanner text="INKTOBER 2026 × ELAS · DAY 07 · SHADOW · " />
            <main className="flex-1 flex flex-col w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 md:mb-0">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

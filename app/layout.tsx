import type { Metadata } from "next";
import { Host_Grotesk, Istok_Web } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";
import { AutoSaveIndicator } from "@/components/AutoSaveIndicator";

const hostGrotesk = Host_Grotesk({
  subsets: ["latin"],
  variable: "--font-host-grotesk",
  weight: "700", // Bold as requested
});

const istokWeb = Istok_Web({
  subsets: ["latin"],
  variable: "--font-istok-web",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "UltimateGoals",
  description: "Align your life. One goal at a time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${hostGrotesk.variable} ${istokWeb.variable} antialiased`}>
        <Providers>
          <AutoSaveIndicator />
          <div className="flex h-screen bg-zinc-950 text-zinc-200">
            <Sidebar />
            <main className="flex-1 overflow-auto p-8 md:p-12">
              <div className="max-w-4xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

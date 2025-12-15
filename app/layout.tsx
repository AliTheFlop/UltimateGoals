import type { Metadata, Viewport } from "next";
import { Host_Grotesk, Istok_Web } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import AutoSaveIndicator from "@/components/AutoSaveIndicator";

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
  manifest: "/manifest.v2.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "UltimateGoals",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // App-like feel
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
            <main className="flex-1 overflow-auto p-4 pb-24 md:p-12 md:pb-12">
              <div className="max-w-4xl mx-auto">
                {children}
              </div>
            </main>
          </div>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}

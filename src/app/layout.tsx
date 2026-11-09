import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { strings } from "@/features/game/ui/strings";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: strings.metadata.appTitle,
  description: strings.metadata.appDescription,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" className={`dark ${inter.variable}`}>
      <body className="min-h-screen bg-[#050811] font-sans text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}

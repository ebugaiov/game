import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { strings } from "@/features/game/ui/strings";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: strings.metadata.appTitle,
  description: strings.metadata.appDescription,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sv" className={`dark ${dmSans.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-ink-750 font-sans text-ink-200 antialiased">{children}</body>
    </html>
  );
}

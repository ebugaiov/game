import type { Difficulty } from "../domain/types";

export const INDUSTRIAL_EMOJIS = [
  "⚙️",
  "🔧",
  "🏭",
  "🥽",
  "🤖",
  "⚡",
  "🔨",
  "🧪",
  "📐",
  "🛡️",
  "🧰",
  "📦",
] as const;

export type PlayerColor = {
  bg: string;
  text: string;
  border: string;
  hex: string;
};

export const PLAYER_PALETTE: readonly PlayerColor[] = [
  { bg: "bg-cyan-500", text: "text-cyan-400", border: "border-cyan-400", hex: "#06b6d4" },
  { bg: "bg-purple-500", text: "text-purple-400", border: "border-purple-400", hex: "#a855f7" },
  { bg: "bg-amber-400", text: "text-amber-400", border: "border-amber-400", hex: "#f59e0b" },
  { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-400", hex: "#10b981" },
  { bg: "bg-rose-500", text: "text-rose-400", border: "border-rose-400", hex: "#f43f5e" },
  { bg: "bg-indigo-500", text: "text-indigo-400", border: "border-indigo-400", hex: "#6366f1" },
  { bg: "bg-yellow-400", text: "text-yellow-400", border: "border-yellow-400", hex: "#eab308" },
  { bg: "bg-fuchsia-500", text: "text-fuchsia-400", border: "border-fuchsia-400", hex: "#d946ef" },
  { bg: "bg-teal-500", text: "text-teal-400", border: "border-teal-400", hex: "#14b8a6" },
  { bg: "bg-orange-500", text: "text-orange-400", border: "border-orange-400", hex: "#f97316" },
  { bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-400", hex: "#3b82f6" },
  { bg: "bg-lime-500", text: "text-lime-400", border: "border-lime-400", hex: "#84cc16" },
  { bg: "bg-red-500", text: "text-red-400", border: "border-red-400", hex: "#ef4444" },
  { bg: "bg-pink-500", text: "text-pink-400", border: "border-pink-400", hex: "#ec4899" },
  { bg: "bg-sky-400", text: "text-sky-300", border: "border-sky-300", hex: "#38bdf8" },
  { bg: "bg-violet-500", text: "text-violet-400", border: "border-violet-400", hex: "#8b5cf6" },
  { bg: "bg-amber-600", text: "text-amber-500", border: "border-amber-500", hex: "#d97706" },
  { bg: "bg-green-500", text: "text-green-400", border: "border-green-400", hex: "#22c55e" },
  { bg: "bg-orange-600", text: "text-orange-500", border: "border-orange-500", hex: "#ea580c" },
  { bg: "bg-cyan-600", text: "text-cyan-500", border: "border-cyan-500", hex: "#0891b2" },
] as const;

export function playerColor(seat: number): PlayerColor {
  return PLAYER_PALETTE[seat % PLAYER_PALETTE.length]!;
}

export function playerEmoji(seat: number): string {
  return INDUSTRIAL_EMOJIS[seat % INDUSTRIAL_EMOJIS.length]!;
}

export const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  medium: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  hard: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  expert: "bg-rose-500/20 text-rose-300 border-rose-500/40",
};

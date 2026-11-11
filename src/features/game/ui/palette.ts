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
  {
    bg: "bg-periwinkle-400",
    text: "text-periwinkle-300",
    border: "border-periwinkle-400",
    hex: "#7e88f7",
  },
  { bg: "bg-gold-500", text: "text-gold-300", border: "border-gold-500", hex: "#e5ae3c" },
  { bg: "bg-success-400", text: "text-success-300", border: "border-success-400", hex: "#57f287" },
  { bg: "bg-danger-400", text: "text-danger-300", border: "border-danger-400", hex: "#ed4245" },
  { bg: "bg-hazard-400", text: "text-hazard-400", border: "border-hazard-400", hex: "#fb923c" },
  { bg: "bg-sky-400", text: "text-sky-300", border: "border-sky-400", hex: "#38bdf8" },
  { bg: "bg-violet-400", text: "text-violet-300", border: "border-violet-400", hex: "#a78bfa" },
  { bg: "bg-rose-400", text: "text-rose-300", border: "border-rose-400", hex: "#fb7185" },
  { bg: "bg-teal-400", text: "text-teal-300", border: "border-teal-400", hex: "#2dd4bf" },
  { bg: "bg-amber-400", text: "text-amber-300", border: "border-amber-400", hex: "#fbbf24" },
  { bg: "bg-blue-500", text: "text-blue-400", border: "border-blue-400", hex: "#3b82f6" },
  { bg: "bg-lime-500", text: "text-lime-400", border: "border-lime-400", hex: "#84cc16" },
  { bg: "bg-red-500", text: "text-red-400", border: "border-red-400", hex: "#ef4444" },
  { bg: "bg-pink-500", text: "text-pink-400", border: "border-pink-400", hex: "#ec4899" },
  { bg: "bg-cyan-400", text: "text-cyan-300", border: "border-cyan-400", hex: "#22d3ee" },
  { bg: "bg-indigo-400", text: "text-indigo-300", border: "border-indigo-400", hex: "#818cf8" },
  { bg: "bg-orange-600", text: "text-orange-500", border: "border-orange-500", hex: "#ea580c" },
  { bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-400", hex: "#10b981" },
  { bg: "bg-fuchsia-500", text: "text-fuchsia-400", border: "border-fuchsia-400", hex: "#d946ef" },
  { bg: "bg-slate-300", text: "text-slate-300", border: "border-slate-300", hex: "#cbd5e1" },
] as const;

export function playerColor(seat: number): PlayerColor {
  return PLAYER_PALETTE[seat % PLAYER_PALETTE.length]!;
}

export function playerEmoji(seat: number): string {
  return INDUSTRIAL_EMOJIS[seat % INDUSTRIAL_EMOJIS.length]!;
}

/**
 * Seeded category colors were chosen for the old neon theme. Map them to the
 * new palette in the UI so the database and seed files stay untouched.
 */
const CATEGORY_COLORS: Record<string, string> = {
  huvudsats: "#7e88f7",
  bisats: "#a78bfa",
  verb1_2: "#f472b6",
  supinum: "#fb923c",
  partikelverb: "#e5ae3c",
  passiv_form: "#22d3ee",
  substantiv: "#57f287",
  adverbial: "#84cc16",
  subjekt_objekt: "#818cf8",
  satsverbial: "#d946ef",
  fundamentet: "#ed4245",
  masterclass: "#f6bd45",
};

export function categoryColor(category: { id: string; color: string }): string {
  return CATEGORY_COLORS[category.id] ?? category.color;
}

export const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: "border-success-400/40 bg-success-400/10 text-success-300",
  medium: "border-gold-600/40 bg-gold-500/10 text-gold-300",
  hard: "border-hazard-400/40 bg-hazard-400/10 text-hazard-400",
  expert: "border-danger-400/40 bg-danger-400/10 text-danger-300",
};

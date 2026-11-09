"use client";

import { BookOpen, X } from "lucide-react";
import { Modal } from "./modal";
import { strings } from "./strings";

const SECTION_BORDERS = [
  "border-cyan-500/30",
  "border-purple-500/30",
  "border-amber-500/30",
  "border-emerald-500/30",
  "border-rose-500/30",
] as const;

const SECTION_TEXT = [
  "text-cyan-400",
  "text-purple-400",
  "text-amber-400",
  "text-emerald-400",
  "text-rose-400",
] as const;

type RulesDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function RulesDialog({ open, onClose }: RulesDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible
      labelledBy="rules-dialog-title"
      className="max-w-3xl border-yellow-500/40"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
          <h3
            id="rules-dialog-title"
            className="flex items-center gap-2 text-xl font-black text-yellow-300"
          >
            <BookOpen className="h-5 w-5" aria-hidden />
            {strings.rules.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={strings.common.close}
            className="text-lg font-bold text-slate-400 transition hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-slate-200 sm:text-sm">
          {strings.rules.sections.map((section, index) => (
            <div
              key={section.title}
              className={`rounded-xl border bg-slate-900/90 p-3.5 ${SECTION_BORDERS[index] ?? "border-slate-700"}`}
            >
              <h4 className={`mb-1 text-sm font-bold ${SECTION_TEXT[index] ?? "text-slate-200"}`}>
                {section.title}
              </h4>
              <p className="leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>

        <div className="pt-2 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-200 transition hover:bg-slate-700"
          >
            {strings.rules.close}
          </button>
        </div>
      </div>
    </Modal>
  );
}

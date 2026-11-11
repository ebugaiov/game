"use client";

import { BookOpen, X } from "lucide-react";
import { Modal } from "./modal";
import { closeButtonClass } from "./styles";
import { Button } from "./button";
import { strings } from "./strings";

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
      className="max-w-3xl border-gold-600/40"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 border-b border-ink-600/80 pb-3">
          <h3
            id="rules-dialog-title"
            className="flex items-center gap-2 font-display text-xl font-bold text-ink-100"
          >
            <BookOpen className="h-5 w-5 text-gold-300" aria-hidden />
            {strings.rules.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={strings.common.close}
            className={closeButtonClass}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-3 text-sm text-ink-200">
          {strings.rules.sections.map((section, index) => (
            <div
              key={section.title}
              className="flex gap-3 rounded-lg border border-ink-600 bg-ink-900/70 p-4"
            >
              <span className="font-display text-lg font-bold leading-none text-periwinkle-300">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h4 className="mb-1 font-display text-base font-bold text-ink-100">
                  {section.title}
                </h4>
                <p className="leading-relaxed text-ink-300">{section.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-1 text-right">
          <Button variant="secondary" onClick={onClose}>
            {strings.rules.close}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

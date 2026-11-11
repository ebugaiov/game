import { strings } from "@/features/game/ui/strings";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex items-center gap-3 rounded-xl border border-ink-600 bg-ink-800 px-6 py-4 shadow-[0_24px_60px_-38px_rgba(0,0,0,0.95)]">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-periwinkle-400 border-t-transparent" />
        <span className="text-sm font-semibold text-ink-200">{strings.common.loading}</span>
      </div>
    </div>
  );
}

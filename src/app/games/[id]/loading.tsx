import { strings } from "@/features/game/ui/strings";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 text-slate-100">
      <div className="glass-panel flex items-center gap-3 rounded-2xl px-6 py-4">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
        <span className="text-sm font-semibold text-slate-200">{strings.common.loading}</span>
      </div>
    </div>
  );
}

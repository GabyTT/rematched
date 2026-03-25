import { ThumbsDown, ThumbsUp } from "lucide-react";

type CarDecisionActionsProps = {
  onLike: () => void;
  onPass: () => void;
};

export function CarDecisionActions({
  onLike,
  onPass,
}: CarDecisionActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onPass}
        className="app-button inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-input bg-input px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent"
      >
        <ThumbsDown size={18} className="text-slate-300" />
        Pass
      </button>
      <button
        type="button"
        onClick={onLike}
        className="app-button inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-accent bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
      >
        <ThumbsUp size={18} className="text-slate-300" />
        Like
      </button>
    </div>
  );
}

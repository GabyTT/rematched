import { Heart, ThumbsDown, ThumbsUp } from "lucide-react";

type CarDecisionActionsProps = {
  onLike: () => void;
  onPass: () => void;
  onTopPick?: () => void;
  variant?: "dark" | "light";
  status?: "liked" | "passed" | "engaged";
};

export function CarDecisionActions({
  onLike,
  onPass,
  onTopPick,
  variant = "dark",
  status,
}: CarDecisionActionsProps) {
  const isLight = variant === "light";
  const isLiked = status === "liked";
  const isTopPick = status === "engaged";
  const PrimaryIcon = isLiked ? Heart : ThumbsUp;
  const primaryLabel = isLiked ? "Top Pick?" : isTopPick ? "Back to Liked" : "Like";
  const primaryAction = isLiked ? onTopPick ?? onLike : onLike;
  const topPickDemotionClassName = isLight
    ? "border border-[#D9E0E7] bg-white text-[#16212B] hover:border-accent"
    : "border border-white/18 bg-transparent text-slate-100 hover:border-white/35 hover:bg-white/6 hover:text-white";
  const primaryClassName = isTopPick
    ? topPickDemotionClassName
    : "border border-accent bg-accent text-white hover:brightness-110";
  const primaryIconClassName = isTopPick
    ? isLight
      ? "text-[#6B7A89]"
      : "text-slate-200"
    : "text-white";

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onPass}
        className={`app-button inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
          isLight
            ? "border border-[#D9E0E7] bg-white text-[#16212B] hover:border-accent"
            : "border border-white/10 bg-transparent text-slate-400 hover:border-white/20 hover:bg-white/4 hover:text-slate-200"
        }`}
      >
        <ThumbsDown
          size={20}
          strokeWidth={0}
          className={`fill-current ${isLight ? "text-[#6B7A89]" : "text-slate-300"}`}
        />
        Pass
      </button>
      <button
        type="button"
        onClick={primaryAction}
        className={`app-button inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${primaryClassName}`}
      >
        <PrimaryIcon
          size={20}
          strokeWidth={0}
          className={`fill-current ${primaryIconClassName}`}
        />
        {primaryLabel}
      </button>
    </div>
  );
}

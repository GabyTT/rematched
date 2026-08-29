import { Heart, ThumbsDown, ThumbsUp } from "lucide-react";

import { buyerCardActionClassName } from "@/lib/buyerCardActionStyles";

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
  const PrimaryIcon = isLiked || isTopPick ? Heart : ThumbsUp;
  const primaryLabel = isLiked ? "Top Pick?" : isTopPick ? "Unpick" : "Like";
  const primaryAction = isLiked ? onTopPick ?? onLike : onLike;
  const topPickDemotionClassName = isLight
    ? buyerCardActionClassName("secondary", "light")
    : buyerCardActionClassName("secondary");
  const primaryClassName = isTopPick
    ? topPickDemotionClassName
    : buyerCardActionClassName("primary", isLight ? "light" : "dark");
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
        className={`flex-1 ${buyerCardActionClassName(
          "neutral",
          isLight ? "light" : "dark",
        )}`}
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
        className={`flex-1 ${primaryClassName}`}
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

import { Eye } from "lucide-react";

import { CarDecisionActions } from "@/components/CarDecisionActions";
import { buyerCardActionClassName } from "@/lib/buyerCardActionStyles";

type CarBrowseActionsProps = {
  onViewDetails: () => void;
  onLike: () => void;
  onPass: () => void;
  onTopPick?: () => void;
  variant?: "dark" | "light";
  status?: "liked" | "passed" | "engaged";
};

export function CarBrowseActions({
  onViewDetails,
  onLike,
  onPass,
  onTopPick,
  variant = "dark",
  status,
}: CarBrowseActionsProps) {
  const isLight = variant === "light";

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onViewDetails}
        className={buyerCardActionClassName(
          "secondary",
          isLight ? "light" : "dark",
        )}
      >
        <Eye
          size={20}
          strokeWidth={2.4}
          className={isLight ? "text-[#6B7A89]" : "text-slate-200"}
        />
        View Details
      </button>
      <CarDecisionActions
        onLike={onLike}
        onPass={onPass}
        onTopPick={onTopPick}
        variant={variant}
        status={status}
      />
    </div>
  );
}

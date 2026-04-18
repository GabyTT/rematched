import { Eye } from "lucide-react";

import { CarDecisionActions } from "@/components/CarDecisionActions";

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
        className={`app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
          isLight
            ? "border border-[#D9E0E7] bg-white text-[#16212B] hover:border-accent hover:bg-accent hover:text-white"
            : "border border-white/18 bg-transparent text-slate-100 hover:border-white/35 hover:bg-white/6 hover:text-white"
        }`}
      >
        <Eye
          size={18}
          className={isLight ? "text-[#6B7A89]" : "text-slate-200"}
        />
        View details
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

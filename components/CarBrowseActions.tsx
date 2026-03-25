import { Eye } from "lucide-react";

import { CarDecisionActions } from "@/components/CarDecisionActions";

type CarBrowseActionsProps = {
  onViewDetails: () => void;
  onLike: () => void;
  onPass: () => void;
};

export function CarBrowseActions({
  onViewDetails,
  onLike,
  onPass,
}: CarBrowseActionsProps) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onViewDetails}
        className="app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent"
      >
        <Eye size={18} className="text-slate-300" />
        View details
      </button>
      <CarDecisionActions onLike={onLike} onPass={onPass} />
    </div>
  );
}

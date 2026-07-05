type TopPickLimitSheetProps = {
  onConfirm: () => void;
  onCancel: () => void;
};

export function TopPickLimitSheet({
  onConfirm,
  onCancel,
}: TopPickLimitSheetProps) {
  return (
    <div className="top-pick-limit-sheet pointer-events-auto rounded-[24px] border border-white/12 bg-[linear-gradient(180deg,rgba(14,20,30,0.94)_0%,rgba(10,15,24,0.98)_100%)] p-4 text-left shadow-[0_20px_42px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-5">
      <h4 className="text-lg font-semibold text-white">Top Picks are full</h4>
      <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-[0.95rem]">
        You can only keep 3 Top Picks for comparison. Do you want to replace
        your earliest Top Pick with this car?
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onConfirm}
          className="app-button inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Replace earliest Top Pick
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/7 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

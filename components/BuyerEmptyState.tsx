import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type BuyerEmptyStateProps = {
  children: ReactNode;
  className?: string;
  compactOnMobile?: boolean;
  illustrationIcon: LucideIcon;
  illustrationLabel: string;
};

export function BuyerEmptyState({
  children,
  className,
  compactOnMobile = false,
  illustrationIcon: IllustrationIcon,
  illustrationLabel,
}: BuyerEmptyStateProps) {
  return (
    <div
      className={`grid items-center gap-5 p-4 sm:gap-8 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.8fr)] lg:gap-10 lg:p-8 ${className ?? ""}`}
    >
      <div className="max-w-xl">{children}</div>

      <div
        aria-hidden="true"
        className={`relative mx-auto w-full sm:h-[15rem] sm:max-w-[24rem] lg:mx-0 ${compactOnMobile ? "h-[7rem] max-w-[12rem]" : "h-[9.5rem] max-w-[16rem]"}`}
      >
        <div className={`absolute left-1 w-[43%] -rotate-[5deg] rounded-[16px] border border-white/10 bg-[#0a1b21] shadow-[0_16px_28px_rgba(0,0,0,0.2)] sm:top-8 sm:h-[12rem] sm:rounded-[20px] ${compactOnMobile ? "top-4 h-[5.5rem]" : "top-5 h-[7.5rem]"}`} />
        <div className={`absolute right-1 w-[43%] rotate-[5deg] rounded-[16px] border border-white/10 bg-[#0a1b21] shadow-[0_16px_28px_rgba(0,0,0,0.2)] sm:top-8 sm:h-[12rem] sm:rounded-[20px] ${compactOnMobile ? "top-4 h-[5.5rem]" : "top-5 h-[7.5rem]"}`} />
        <div className={`absolute left-1/2 top-0 flex w-[52%] -translate-x-1/2 flex-col overflow-hidden rounded-[18px] border border-white/15 bg-[#0d2229] shadow-[0_20px_34px_rgba(0,0,0,0.3)] sm:h-[14rem] sm:rounded-[22px] ${compactOnMobile ? "h-[6.5rem]" : "h-[8.75rem]"}`}>
          <div className="flex h-[48%] items-center justify-center bg-[radial-gradient(circle_at_50%_5%,rgba(226,15,65,0.3),transparent_58%),linear-gradient(135deg,#102a31,#07191e)]">
            <IllustrationIcon
              size={30}
              strokeWidth={1.8}
              className="text-slate-300 sm:h-[38px] sm:w-[38px]"
            />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1.5 p-3 sm:gap-2.5 sm:p-4">
            <div className="h-2 w-4/5 rounded-full bg-white/20 sm:h-2.5" />
            <div className="h-2 w-3/5 rounded-full bg-white/10 sm:h-2.5" />
            <div className="mt-0.5 flex items-center gap-1.5 text-[0.55rem] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:mt-1 sm:gap-2 sm:text-[0.65rem] sm:tracking-[0.2em]">
              <IllustrationIcon size={11} strokeWidth={2.2} className="sm:h-[14px] sm:w-[14px]" />
              {illustrationLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

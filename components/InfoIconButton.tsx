import type { ButtonHTMLAttributes } from "react";

type InfoIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  focusRingOffsetClassName?: string;
};

export function InfoIconButton({
  children,
  className = "",
  focusRingOffsetClassName = "focus-visible:ring-offset-panel",
  ...props
}: InfoIconButtonProps) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#52657A] bg-[#2E3C4A] text-[#D7DEE6] shadow-[0_8px_18px_rgba(0,0,0,0.2)] transition hover:scale-105 hover:border-accent hover:bg-accent hover:text-white focus-visible:border-accent focus-visible:bg-accent focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 ${focusRingOffsetClassName} active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}

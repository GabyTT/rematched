export type BuyerCardActionTone =
  | "primary"
  | "secondary"
  | "tertiary"
  | "neutral"
  | "liked-primary"
  | "liked-tertiary"
  | "liked-reversal";
export type BuyerCardActionSurface = "dark" | "light";

const baseClassName =
  "app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2";

const tones: Record<BuyerCardActionSurface, Record<BuyerCardActionTone, string>> = {
  dark: {
    primary: "border border-accent bg-accent text-white hover:brightness-110 focus-visible:ring-offset-panel",
    secondary:
      "border border-[#5E7285] bg-[#10222D] text-slate-100 hover:border-slate-300 hover:bg-[#172C38] hover:text-white focus-visible:ring-offset-panel",
    tertiary:
      "border border-transparent bg-transparent text-slate-300 hover:bg-white/8 hover:text-white focus-visible:ring-offset-panel",
    neutral:
      "border border-slate-600 bg-transparent text-slate-300 hover:border-slate-400 hover:bg-white/5 hover:text-white focus-visible:ring-offset-panel",
    "liked-primary":
      "border border-accent bg-accent text-white shadow-[0_8px_18px_rgba(209,19,58,0.2)] hover:brightness-110 hover:shadow-[0_10px_22px_rgba(209,19,58,0.28)] focus-visible:ring-offset-panel",
    "liked-tertiary":
      "border border-transparent bg-transparent font-medium text-slate-400 hover:bg-white/6 hover:text-slate-200 focus-visible:ring-offset-panel",
    "liked-reversal":
      "border border-slate-700/70 bg-transparent font-medium text-slate-400 hover:border-slate-500 hover:bg-white/[0.04] hover:text-slate-200 focus-visible:ring-offset-panel",
  },
  light: {
    primary: "border border-accent bg-accent text-white hover:brightness-110 focus-visible:ring-offset-white",
    secondary:
      "border border-[#B9C6D0] bg-[#F8FAFC] text-[#16212B] hover:border-[#6B7A89] hover:bg-white focus-visible:ring-offset-white",
    tertiary:
      "border border-transparent bg-transparent text-[#52657A] hover:bg-[#E9EFF3] hover:text-[#16212B] focus-visible:ring-offset-white",
    neutral:
      "border border-[#B9C6D0] bg-white text-[#52657A] hover:border-[#6B7A89] hover:bg-[#F3F6F8] hover:text-[#16212B] focus-visible:ring-offset-white",
    "liked-primary":
      "border border-accent bg-accent text-white shadow-[0_8px_18px_rgba(209,19,58,0.2)] hover:brightness-110 hover:shadow-[0_10px_22px_rgba(209,19,58,0.28)] focus-visible:ring-offset-white",
    "liked-tertiary":
      "border border-transparent bg-transparent font-medium text-[#6B7A89] hover:bg-[#E9EFF3] hover:text-[#16212B] focus-visible:ring-offset-white",
    "liked-reversal":
      "border border-[#D5DEE5] bg-transparent font-medium text-[#6B7A89] hover:border-[#9AAAB7] hover:bg-[#F3F6F8] hover:text-[#16212B] focus-visible:ring-offset-white",
  },
};

export function buyerCardActionClassName(
  tone: BuyerCardActionTone,
  surface: BuyerCardActionSurface = "dark",
) {
  return `${baseClassName} ${tones[surface][tone]}`;
}

import { Shield, Star, Triangle } from "lucide-react";

export type SponsorKey = "summit-bank" | "northstar-finance" | "shield-insurance";

const sponsors = {
  "summit-bank": {
    name: "Summit Bank",
    Icon: Triangle,
  },
  "northstar-finance": {
    name: "Northstar Finance",
    Icon: Star,
  },
  "shield-insurance": {
    name: "Shield Insurance",
    Icon: Shield,
  },
} as const;

type SponsorProps = {
  sponsor: SponsorKey;
  size?: "small" | "header";
  iconOnly?: boolean;
};

export function Sponsor({ sponsor, size = "small", iconOnly = false }: SponsorProps) {
  const { name, Icon } = sponsors[sponsor];
  const iconSizeClassName =
    size === "header" ? "h-8 w-8" : "h-6 w-6";
  const iconGlyphSize = size === "header" ? 18 : 14;
  const labelClassName =
    size === "header" ? "text-base text-slate-50" : "text-sm text-slate-100";

  return (
    <span className="inline-flex shrink-0 items-center gap-2">
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/8 text-slate-100 shadow-[0_8px_18px_rgba(0,0,0,0.18)] ${iconSizeClassName}`}
        aria-hidden="true"
      >
        <Icon size={iconGlyphSize} strokeWidth={2.2} />
      </span>
      {iconOnly ? null : (
        <span className={`font-semibold ${labelClassName}`}>{name}</span>
      )}
    </span>
  );
}

type SponsorActionButtonProps = {
  sponsor: SponsorKey;
  children: React.ReactNode;
};

export function SponsorActionButton({
  sponsor,
  children,
}: SponsorActionButtonProps) {
  return (
    <button
      type="button"
      className="app-button inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full border border-white/18 bg-transparent px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/35 hover:bg-white/6 hover:text-white"
    >
      <Sponsor sponsor={sponsor} iconOnly />
      {children}
    </button>
  );
}

type SponsorCardProps = {
  sponsor: SponsorKey;
  title: string;
  description: string;
  cta: string;
};

export function SponsorCard({
  sponsor,
  title,
  description,
  cta,
}: SponsorCardProps) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_18px_44px_rgba(0,0,0,0.18)] sm:p-7">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {description}
          </p>
        </div>
        <SponsorActionButton sponsor={sponsor}>{cta}</SponsorActionButton>
      </div>
      <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-300">
        <Sponsor sponsor={sponsor} />
      </p>
    </div>
  );
}

import Image from "next/image";
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
    size === "header" ? "h-9 w-9" : "h-8 w-8";
  const iconGlyphSize = size === "header" ? 20 : 18;
  const labelClassName =
    size === "header" ? "text-base text-slate-50" : "text-sm text-slate-100";

  return (
    <span className="inline-flex shrink-0 items-center gap-2">
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 shadow-[0_8px_18px_rgba(0,0,0,0.18)] backdrop-blur-sm transition hover:bg-white/10 ${iconSizeClassName}`}
        aria-hidden="true"
      >
        <Icon size={iconGlyphSize} strokeWidth={2.4} />
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
  cta,
}: SponsorCardProps) {
  const { name } = sponsors[sponsor];

  return (
    <article className="w-full overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0.035)_52%,rgba(255,255,255,0.02)_100%)] px-4 py-4 shadow-[0_16px_36px_rgba(0,0,0,0.2)] sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-[18px] border border-white/10 bg-white/5 sm:h-20 sm:w-32 lg:h-24 lg:w-40">
          <Image
            src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80"
            alt="Insurance and ownership documents arranged on a desk"
            fill
            sizes="(max-width: 639px) 100vw, 160px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/36 via-black/8 to-transparent" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold tracking-tight text-white md:text-xl">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-5 text-slate-300 md:text-base">
            Check real costs before deciding.
          </p>
          <p className="mt-1.5 text-xs font-medium text-slate-400 md:text-sm">
            Insurance support by {name}
          </p>
        </div>

        <div className="flex shrink-0 sm:justify-end">
          <button
            type="button"
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-full border border-white/18 bg-transparent px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/35 hover:bg-white/10 hover:text-white"
          >
            {cta}
          </button>
        </div>
      </div>
    </article>
  );
}

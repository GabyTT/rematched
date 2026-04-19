import Image from "next/image";

import type { SponsorAd } from "@/lib/sponsorAds";

type SponsorCardProps = {
  ad: SponsorAd;
};

export function SponsorCard({ ad }: SponsorCardProps) {
  const {
    sponsorName,
    title,
    body,
    cta,
    image,
    imageAlt,
  } = ad;

  return (
    <article
      aria-label={`Sponsored utility card from ${sponsorName}`}
      className="group interactive-panel page-panel flex h-full flex-col overflow-hidden rounded-[28px] border border-emerald-500/70 bg-panel shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-[0_28px_60px_rgba(0,0,0,0.45),0_0_24px_rgba(16,185,129,0.12)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={image}
          alt={imageAlt}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
          draggable={false}
          className="pointer-events-none block object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/18 to-transparent" />
        <div className="absolute left-4 top-4 z-10 inline-flex min-h-9 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-slate-200 shadow-[0_8px_18px_rgba(0,0,0,0.18)] backdrop-blur-sm transition hover:bg-white/10">
          Sponsored
        </div>
      </div>

      <div className="flex flex-1 flex-col space-y-4 p-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-semibold text-slate-200 backdrop-blur-sm transition hover:bg-white/10">
          Decision support
        </span>

        <div className="space-y-2">
          <h3 className="text-xl font-bold leading-tight tracking-tight text-white">
            {title}
          </h3>
          <p className="truncate text-sm leading-5 text-slate-300">
            {body}
          </p>
        </div>

        <p className="mt-2 text-xs font-medium text-slate-500">
          Sponsored by {sponsorName}
        </p>

        <div className="mt-auto space-y-2">
          <p className="text-xs text-slate-400">Free estimate • No commitment</p>
          <button
            type="button"
            className="inline-flex min-h-11 w-auto items-center justify-center rounded-full border border-slate-500 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-200 transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white active:translate-y-0"
          >
            {cta}
          </button>
        </div>
      </div>
    </article>
  );
}

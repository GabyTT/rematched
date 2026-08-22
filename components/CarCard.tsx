import type { ReactNode } from "react";
import Image from "next/image";
import { Heart, ThumbsDown, ThumbsUp } from "lucide-react";

type CarCardProps = {
  name: string;
  price: string;
  category: string;
  facts?: string[];
  image: string;
  imageIsPlaceholder?: boolean;
  isNegotiable?: boolean;
  imageBadge?: ReactNode;
  indicator?: ReactNode;
  footer?: ReactNode;
  overlay?: ReactNode;
  variant?: "dark" | "light";
  status?: "liked" | "passed" | "engaged";
  topPickCount?: number;
};

export function CarCard({
  name,
  price,
  category,
  facts = [],
  image,
  imageIsPlaceholder = false,
  isNegotiable = false,
  imageBadge,
  indicator,
  footer,
  overlay,
  variant = "dark",
  status,
  topPickCount = 0,
}: CarCardProps) {
  const isLight = variant === "light";
  const statusConfig =
    status === "liked"
      ? {
          label: "Liked",
          icon: ThumbsUp,
          iconClassName: "text-white",
          pillClassName:
            "border-[#8B2439]/60 bg-[#42111B]/82 text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)]",
          cardStateClassName: "card-status-liked",
        }
      : status === "passed"
        ? {
          label: "Passed",
          icon: ThumbsDown,
          iconClassName: "text-[#475569]",
          pillClassName:
            "border-transparent bg-[#CBD5E1] text-[#334155] shadow-[0_8px_18px_rgba(0,0,0,0.14)]",
            cardStateClassName: "card-status-passed opacity-95",
          }
        : status === "engaged"
          ? {
              label: topPickCount === 1 ? "The One" : "Top Pick",
              icon: Heart,
              iconClassName: "text-white",
              pillClassName:
                "border-transparent bg-[#D1133A] text-white shadow-[0_10px_22px_rgba(209,19,58,0.28)]",
              cardStateClassName: "card-status-engaged",
            }
          : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <article
      data-card-root="true"
      data-card-status={status ?? "default"}
      className={`group interactive-card-hover interactive-panel page-panel relative flex h-full flex-col overflow-hidden rounded-[26px] transition duration-300 ${
        isLight
          ? "border border-transparent bg-[#F7F7F8] shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
          : "border border-transparent bg-panel shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
      } ${statusConfig ? statusConfig.cardStateClassName : ""}`}
    >
      <div
        className={`relative aspect-[16/9] overflow-hidden ${
          isLight ? "aspect-[16/10]" : ""
        }`}
      >
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
          draggable={false}
          className="card-hover-image interactive-card-image pointer-events-none block object-cover object-center transition duration-500"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        {imageBadge || statusConfig ? (
          <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
            {imageBadge}
            {statusConfig && StatusIcon ? (
              <span
                className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold leading-none backdrop-blur-sm transition hover:bg-white/10 ${statusConfig.pillClassName}`}
              >
                <StatusIcon
                  size={20}
                  strokeWidth={0}
                  className={`fill-current ${statusConfig.iconClassName}`}
                />
                {statusConfig.label}
              </span>
            ) : null}
          </div>
        ) : null}
        {imageIsPlaceholder ? (
          <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-full border border-amber-200/30 bg-black/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-amber-100 backdrop-blur-sm">
            AI illustration — not the actual vehicle
          </span>
        ) : null}
      </div>

      <div className={`flex flex-1 flex-col gap-1.5 ${isLight ? "p-[1.125rem]" : "p-[1.125rem]"}`}>
        <div className="flex items-center justify-between gap-4">
          <span
            className={`inline-flex min-w-0 max-w-[58%] items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/10 ${
              isLight
                ? "border border-[#D9E0E7] bg-white/90 text-[#314154]"
                : "border border-white/10 bg-white/5 text-slate-200"
            }`}
          >
            <span className="truncate">{category}</span>
          </span>
          <div className="shrink-0 text-right">
            <p
              className={`text-xl font-semibold tracking-tight sm:text-2xl ${
                isLight ? "text-[#16212B]" : "text-white"
              }`}
            >
              {price}
            </p>
            {isNegotiable ? (
              <span className="mt-1 inline-flex rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-0.5 text-xs font-semibold text-amber-100">
                Negotiable
              </span>
            ) : null}
          </div>
        </div>

        <div className="min-h-7">
          <h3
            className={`truncate whitespace-nowrap text-lg font-semibold tracking-tight ${
              isLight ? "text-[#16212B]" : "text-white"
            }`}
          >
            {name}
          </h3>
        </div>

        {facts.length > 0 ? (
          <p className={`text-sm leading-6 ${isLight ? "text-[#52657A]" : "text-slate-300"}`}>
            {facts.join(" · ")}
          </p>
        ) : null}

        <div className={indicator ? "min-h-6" : "min-h-1"}>
          {indicator}
        </div>

        <div>
          {footer ?? (
            <button
              className={`app-button inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 ${
                isLight
                  ? "border border-accent bg-accent text-white hover:brightness-110"
                  : "border border-accent text-white hover:bg-accent"
              }`}
            >
              View Details
            </button>
          )}
        </div>
      </div>

      {overlay ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20">
          {overlay}
        </div>
      ) : null}
    </article>
  );
}

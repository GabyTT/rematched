import type { ReactNode } from "react";
import Image from "next/image";
import { Heart, ThumbsDown, ThumbsUp } from "lucide-react";

type CarCardProps = {
  name: string;
  price: string;
  category: string;
  image: string;
  imageBadge?: ReactNode;
  indicator?: ReactNode;
  footer?: ReactNode;
  variant?: "dark" | "light";
  status?: "liked" | "passed" | "engaged";
  topPickCount?: number;
};

export function CarCard({
  name,
  price,
  category,
  image,
  imageBadge,
  indicator,
  footer,
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
          iconClassName: "text-[#D1133A]",
          pillClassName:
            "border-transparent bg-white text-[#111827] shadow-[0_8px_18px_rgba(0,0,0,0.18)]",
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
              iconClassName: "text-[#D1133A]",
              pillClassName:
                "border-transparent bg-white text-[#111827] shadow-[0_8px_18px_rgba(0,0,0,0.18)]",
              cardStateClassName:
                "card-status-engaged shadow-[0_22px_52px_rgba(0,0,0,0.34),0_0_0_1px_rgba(247,247,248,0.1),0_0_24px_rgba(247,247,248,0.08)]",
            }
          : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <article
      data-card-status={status ?? "default"}
      className={`group interactive-panel page-panel overflow-hidden rounded-[28px] transition duration-300 ${
        isLight
          ? "border border-transparent bg-[#F7F7F8] shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.12)]"
          : "border border-transparent bg-panel shadow-[0_18px_40px_rgba(0,0,0,0.28)] hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(0,0,0,0.45)]"
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
          className="pointer-events-none block object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
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
      </div>

      <div className={`space-y-4 ${isLight ? "p-5" : "p-5"}`}>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/10 ${
            isLight
              ? "border border-[#D9E0E7] bg-white/90 text-[#314154]"
              : "border border-white/10 bg-white/5 text-slate-200"
          }`}
        >
          {category}
        </span>

        <div className="flex items-start justify-between gap-4">
          <h3
            className={`min-w-0 flex-1 text-lg font-semibold tracking-tight ${
              isLight ? "text-[#16212B]" : "text-white"
            }`}
          >
            {name}
          </h3>
          <p
            className={`shrink-0 text-2xl font-semibold tracking-tight ${
              isLight ? "text-[#16212B]" : "text-white"
            }`}
          >
            {price}
          </p>
        </div>

        {indicator}

        {footer ?? (
          <button
            className={`app-button inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition duration-200 ${
              isLight
                ? "border border-accent bg-accent text-white hover:brightness-110"
                : "border border-accent text-white hover:bg-accent"
            }`}
          >
            View details
          </button>
        )}
      </div>
    </article>
  );
}

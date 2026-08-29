"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Heart, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

import { buyerCardActionClassName } from "@/lib/buyerCardActionStyles";
import { AI_CAR_PLACEHOLDER_PATH } from "@/lib/listingImagePolicy";

type CarCardProps = {
  name: string;
  price: string;
  category: string;
  facts?: string[];
  image: string;
  images?: string[];
  imageIsPlaceholder?: boolean;
  isNegotiable?: boolean;
  imageBadge?: ReactNode;
  indicator?: ReactNode;
  footer?: ReactNode;
  overlay?: ReactNode;
  variant?: "dark" | "light";
  status?: "liked" | "passed" | "engaged" | "sold";
  topPickCount?: number;
};

export function CarCard({
  name,
  price,
  category,
  facts = [],
  image,
  images,
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
  const galleryImages = (images?.length ? images : [image]).filter(Boolean);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [failedImageIndexes, setFailedImageIndexes] = useState<Set<number>>(
    new Set(),
  );
  const activeImage = galleryImages[activeImageIndex] ?? AI_CAR_PLACEHOLDER_PATH;
  const hasGallery = galleryImages.length > 1;
  const isShowingFallback =
    !galleryImages.length || failedImageIndexes.has(activeImageIndex);

  const isLight = variant === "light";
  const hasCategory = category.trim().length > 0;
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
                "border-[#E23B5E]/70 bg-[#57101F] text-[#FFE6EB] shadow-[0_10px_22px_rgba(113,16,43,0.28)]",
              cardStateClassName: "card-status-engaged",
            }
          : status === "sold"
            ? {
                label: "Sold",
                icon: ThumbsDown,
                iconClassName: "text-white",
                pillClassName:
                  "border-slate-400/45 bg-slate-700/85 text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)]",
                cardStateClassName:
                  "card-status-passed opacity-[0.82] saturate-[0.82]",
              }
          : null;
  const StatusIcon = statusConfig?.icon;

  const showPreviousImage = () => {
    setActiveImageIndex((currentIndex) =>
      currentIndex === 0 ? galleryImages.length - 1 : currentIndex - 1,
    );
  };

  const showNextImage = () => {
    setActiveImageIndex((currentIndex) =>
      currentIndex === galleryImages.length - 1 ? 0 : currentIndex + 1,
    );
  };

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
          src={isShowingFallback ? AI_CAR_PLACEHOLDER_PATH : activeImage}
          alt={`${name}${hasGallery ? ` photo ${activeImageIndex + 1} of ${galleryImages.length}` : ""}`}
          fill
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
          draggable={false}
          onError={() => {
            setFailedImageIndexes((current) => {
              const next = new Set(current);
              next.add(activeImageIndex);
              return next;
            });
          }}
          className="card-hover-image interactive-card-image pointer-events-none block object-cover object-center transition duration-500"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        {hasGallery ? (
          <>
            <button
              type="button"
              onClick={showPreviousImage}
              aria-label={`Show previous photo of ${name}`}
              className="app-button absolute left-3 top-1/2 z-10 inline-flex -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/65 p-2 text-white transition hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={showNextImage}
              aria-label={`Show next photo of ${name}`}
              className="app-button absolute right-3 top-1/2 z-10 inline-flex -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/65 p-2 text-white transition hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
            <span className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-white/15 bg-black/65 px-2.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
              {activeImageIndex + 1} / {galleryImages.length}
            </span>
          </>
        ) : null}
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
        {imageIsPlaceholder || isShowingFallback ? (
          <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-full border border-amber-200/30 bg-black/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-amber-100 backdrop-blur-sm">
            AI illustration — not the actual vehicle
          </span>
        ) : null}
      </div>

      <div className={`flex flex-1 flex-col gap-1.5 ${isLight ? "p-[1.125rem]" : "p-[1.125rem]"}`}>
        <div className="flex flex-col gap-2">
          {hasCategory ? (
            <span
              className={`inline-flex w-fit max-w-full items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/10 ${
                isLight
                  ? "border border-[#D9E0E7] bg-white/90 text-[#314154]"
                  : "border border-white/10 bg-white/5 text-slate-200"
              }`}
            >
              <span className="truncate">{category}</span>
            </span>
          ) : null}
          <div className="flex min-w-0 items-center justify-between gap-3">
            <p
              className={`min-w-0 truncate text-xl font-semibold tracking-tight sm:text-2xl ${
                isLight ? "text-[#16212B]" : "text-white"
              }`}
            >
              {price}
            </p>
            {isNegotiable ? (
              <span
                className={`inline-flex shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  isLight
                    ? "border-[#C7D3DD] bg-[#E8EEF3] text-[#52657A]"
                    : "border-slate-600/70 bg-slate-800/70 text-slate-200"
                }`}
              >
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
              className={buyerCardActionClassName(
                "secondary",
                isLight ? "light" : "dark",
              )}
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

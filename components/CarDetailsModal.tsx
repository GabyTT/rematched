"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import type { Car } from "@/lib/cars";

type CarDetailsModalProps = {
  car: Car;
  onClose: () => void;
};

function phoneLink(phoneNumber: string) {
  return `tel:${phoneNumber.replace(/[^0-9+]/g, "")}`;
}

export function CarDetailsModal({ car, onClose }: CarDetailsModalProps) {
  const galleryImages = car.images?.length ? car.images : [car.image];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = galleryImages[activeImageIndex] ?? galleryImages[0];
  const hasGallery = galleryImages.length > 1;

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

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
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 px-5 py-5 sm:py-8">
      <div className="mx-auto w-full max-w-4xl rounded-[28px] border border-input bg-panel p-5 shadow-[0_28px_80px_rgba(0,0,0,0.45)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
              Car details
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {car.name}
            </h2>
            <p className="mt-2 text-sm text-slate-300">{car.price}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="app-button rounded-full border border-input bg-input px-3 py-2 text-sm font-medium text-white transition hover:border-accent"
          >
            Close
          </button>
        </div>

        <section className="mt-6">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-input bg-input/70">
            <Image
              src={activeImage}
              alt={`${car.name} photo ${activeImageIndex + 1} of ${galleryImages.length}`}
              fill
              sizes="(max-width: 1024px) 100vw, 896px"
              className="object-cover object-center"
            />
            {car.imageIsPlaceholder ? (
              <span className="absolute bottom-3 left-3 rounded-full border border-amber-200/30 bg-black/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-amber-100 backdrop-blur-sm">
                AI illustration — not the actual vehicle
              </span>
            ) : null}
            {hasGallery ? (
              <>
                <button
                  type="button"
                  onClick={showPreviousImage}
                  className="app-button absolute left-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/65 p-2 text-white transition hover:bg-black/85"
                  aria-label="Show previous photo"
                >
                  <ChevronLeft size={24} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  className="app-button absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/65 p-2 text-white transition hover:bg-black/85"
                  aria-label="Show next photo"
                >
                  <ChevronRight size={24} aria-hidden="true" />
                </button>
                <span className="absolute bottom-3 right-3 rounded-full border border-white/15 bg-black/65 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                  {activeImageIndex + 1} of {galleryImages.length}
                </span>
              </>
            ) : null}
          </div>

          {hasGallery ? (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1" aria-label="Car photo gallery">
              {galleryImages.map((imageUrl, imageIndex) => {
                const isActive = imageIndex === activeImageIndex;

                return (
                  <button
                    key={imageUrl}
                    type="button"
                    onClick={() => setActiveImageIndex(imageIndex)}
                    aria-label={`Show photo ${imageIndex + 1} of ${galleryImages.length}`}
                    aria-pressed={isActive}
                    className={`app-button relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border transition sm:h-24 sm:w-36 ${
                      isActive
                        ? "border-emerald-300 ring-2 ring-emerald-300/50"
                        : "border-input hover:border-white/45"
                    }`}
                  >
                    <Image
                      src={imageUrl}
                      alt=""
                      fill
                      sizes="144px"
                      className="object-cover object-center"
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-input bg-input/70 p-4">
            <p className="text-sm text-slate-400">Make</p>
            <p className="mt-2 text-base font-semibold text-white">{car.make}</p>
          </div>
          <div className="rounded-2xl border border-input bg-input/70 p-4">
            <p className="text-sm text-slate-400">Model</p>
            <p className="mt-2 text-base font-semibold text-white">{car.model}</p>
          </div>
          <div className="rounded-2xl border border-input bg-input/70 p-4">
            <p className="text-sm text-slate-400">Year</p>
            <p className="mt-2 text-base font-semibold text-white">{car.year}</p>
          </div>
          <div className="rounded-2xl border border-input bg-input/70 p-4">
            <p className="text-sm text-slate-400">Mileage</p>
            <p className="mt-2 text-base font-semibold text-white">
              {car.mileage}
            </p>
          </div>
          {car.plateSeries ? (
            <div className="rounded-2xl border border-input bg-input/70 p-4">
              <p className="text-sm text-slate-400">Registration series</p>
              <p className="mt-2 text-base font-semibold text-white">{car.plateSeries}</p>
            </div>
          ) : null}
          {car.colour ? (
            <div className="rounded-2xl border border-input bg-input/70 p-4">
              <p className="text-sm text-slate-400">Colour</p>
              <p className="mt-2 text-base font-semibold text-white">{car.colour}</p>
            </div>
          ) : null}
          {car.engineSize ? (
            <div className="rounded-2xl border border-input bg-input/70 p-4">
              <p className="text-sm text-slate-400">Engine size</p>
              <p className="mt-2 text-base font-semibold text-white">{car.engineSize}</p>
            </div>
          ) : null}
          <div className="rounded-2xl border border-input bg-input/70 p-4">
            <p className="text-sm text-slate-400">Price</p>
            <p className="mt-2 text-base font-semibold text-white">
              {car.price}{car.isNegotiable ? " · Negotiable" : ""}
            </p>
          </div>
          <div className="rounded-2xl border border-input bg-input/70 p-4">
            <p className="text-sm text-slate-400">Fuel</p>
            <p className="mt-2 text-base font-semibold text-white">{car.fuel}</p>
          </div>
          <div className="rounded-2xl border border-input bg-input/70 p-4">
            <p className="text-sm text-slate-400">Transmission</p>
            <p className="mt-2 text-base font-semibold text-white">
              {car.transmission}
            </p>
          </div>
          <div className="rounded-2xl border border-input bg-input/70 p-4">
            <p className="text-sm text-slate-400">Location</p>
            <p className="mt-2 text-base font-semibold text-white">
              {car.location}
            </p>
          </div>
          <div className="rounded-2xl border border-input bg-input/70 p-4">
            <p className="text-sm text-slate-400">Category</p>
            <p className="mt-2 text-base font-semibold text-white">
              {car.category}
            </p>
          </div>
        </div>

        {car.sellerContactName || car.sellerContactPhone ? (
          <section className="mt-6 rounded-2xl border border-emerald-300/30 bg-emerald-400/5 p-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">
              Contact seller
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {car.sellerContactName ? (
                  <p className="text-base font-semibold text-white">
                    {car.sellerContactName}
                  </p>
                ) : null}
                {car.sellerContactPhone ? (
                  <p className="mt-1 text-base text-slate-200">
                    {car.sellerContactPhone}
                  </p>
                ) : null}
              </div>
              {car.sellerContactPhone ? (
                <a
                  href={phoneLink(car.sellerContactPhone)}
                  className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-accent bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Call seller
                </a>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

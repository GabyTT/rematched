"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Copy, Eye, FileText, Heart, Phone, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { Car } from "@/lib/cars";
import { phoneLink, sellerWhatsAppLink } from "@/lib/sellerContact";
import { buyerCardActionClassName } from "@/lib/buyerCardActionStyles";
import { AI_CAR_PLACEHOLDER_PATH } from "@/lib/listingImagePolicy";
import { isSoldListing } from "@/lib/matching";

type CompareCar = Car & {
  notes: string;
};

type CompareTableProps = {
  cars: CompareCar[];
  hasEligibleAdditionalLikedCar: boolean;
  onOpenNotes: (carId: string) => void;
  onViewDetails: (carId: string) => void;
  onRemoveFromEngage: (carId: string) => void;
  maxCars?: number;
};

const rows: Array<{
  key:
    | "price"
    | "mileage"
    | "year"
    | "plateSeries"
    | "fuel"
    | "transmission"
    | "engineSize"
    | "colour"
    | "negotiable"
    | "location"
    | "category"
    | "notes";
  label: string;
}> = [
  { key: "price", label: "Price" },
  { key: "year", label: "Year" },
  { key: "plateSeries", label: "Registration Series" },
  { key: "mileage", label: "Mileage" },
  { key: "category", label: "Vehicle Type" },
  { key: "engineSize", label: "Engine Size" },
  { key: "fuel", label: "Fuel" },
  { key: "transmission", label: "Transmission" },
  { key: "colour", label: "Colour" },
  { key: "negotiable", label: "Negotiable" },
  { key: "location", label: "Location" },
  { key: "notes", label: "Notes" },
];

const emphasizedRows = new Set(["price", "mileage", "year"]);

function TopPickImageCarousel({ car }: { car: CompareCar }) {
  const galleryImages = (car.images?.length ? car.images : [car.image]).filter(
    Boolean,
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [failedImageIndexes, setFailedImageIndexes] = useState<Set<number>>(
    new Set(),
  );
  const activeImage = galleryImages[activeImageIndex] ?? AI_CAR_PLACEHOLDER_PATH;
  const hasGallery = galleryImages.length > 1;
  const isShowingFallback =
    !galleryImages.length || failedImageIndexes.has(activeImageIndex);

  const showPreviousImage = () => {
    setActiveImageIndex((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1,
    );
  };
  const showNextImage = () => {
    setActiveImageIndex((current) =>
      current === galleryImages.length - 1 ? 0 : current + 1,
    );
  };

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-[18px]">
      <Image
        src={isShowingFallback ? AI_CAR_PLACEHOLDER_PATH : activeImage}
        alt={`${car.name}${hasGallery ? ` photo ${activeImageIndex + 1} of ${galleryImages.length}` : ""}`}
        fill
        sizes="(max-width: 767px) 80vw, 28vw"
        onError={() => {
          setFailedImageIndexes((current) => {
            const next = new Set(current);
            next.add(activeImageIndex);
            return next;
          });
        }}
        className="object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      {hasGallery ? (
        <>
          <button
            type="button"
            onClick={showPreviousImage}
            aria-label={`Show previous photo of ${car.name}`}
            className="app-button absolute left-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 p-1.5 text-white transition hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={showNextImage}
            aria-label={`Show next photo of ${car.name}`}
            className="app-button absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 p-1.5 text-white transition hover:bg-black/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
          <span className="pointer-events-none absolute bottom-2 right-2 rounded-full border border-white/15 bg-black/60 px-2 py-0.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
            {activeImageIndex + 1} / {galleryImages.length}
          </span>
        </>
      ) : null}
    </div>
  );
}

function SellerContactPopover({
  car,
  isOpen,
  onOpenChange,
}: {
  car: CompareCar;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);
  const whatsappLink = car.sellerContactPhone
    ? sellerWhatsAppLink({ phoneNumber: car.sellerContactPhone, vehicle: car })
    : null;

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !popoverRef.current?.contains(target) &&
        !sheetRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        onOpenChange(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    if (!isOpen || !window.matchMedia("(max-width: 767px)").matches) return;

    closeButtonRef.current?.focus();
  }, [isOpen]);

  const copyNumber = async () => {
    if (!car.sellerContactPhone || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(car.sellerContactPhone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be denied by the browser; leave the original action available.
    }
  };

  const contactDetails = (
    <>
      {car.sellerContactName ? (
        <p className="mt-2 font-semibold text-white">{car.sellerContactName}</p>
      ) : null}
      {car.sellerContactPhone ? (
        <p className="mt-1 text-sm text-slate-200">{car.sellerContactPhone}</p>
      ) : (
        <p className="mt-2 text-sm text-slate-300">
          Seller contact details are not available for this listing.
        </p>
      )}
      {car.sellerContactPhone ? (
        <div className="mt-4 grid gap-2">
          <a
            href={phoneLink(car.sellerContactPhone)}
            className="app-button inline-flex min-h-10 items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Call seller
          </a>
          {whatsappLink ? (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="app-button inline-flex min-h-10 items-center justify-center rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-[#062813] transition hover:brightness-110"
            >
              WhatsApp
            </a>
          ) : null}
          <button
            type="button"
            onClick={copyNumber}
            className="app-button inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/8"
          >
            <Copy size={16} aria-hidden="true" />
            {copied ? "Number copied" : "Copy number"}
          </button>
        </div>
      ) : null}
    </>
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-controls={`seller-contact-${car.id}`}
        className={buyerCardActionClassName("secondary")}
      >
        <Phone size={20} strokeWidth={2.4} className="text-slate-200" />
        Contact seller
      </button>
      {isOpen ? (
        <div
          ref={popoverRef}
          id={`seller-contact-${car.id}`}
          role="dialog"
          aria-label={`Contact seller for ${car.name}`}
          className="absolute left-0 top-[calc(100%+0.65rem)] z-30 hidden w-[min(19rem,calc(100vw-3rem))] rounded-2xl border border-[#52657A] bg-[#0B1B25] p-4 text-left shadow-[0_18px_36px_rgba(0,0,0,0.42)] md:block"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Contact seller
          </p>
          {contactDetails}
        </div>
      ) : null}
      {isOpen && typeof document !== "undefined"
        ? createPortal(
        <div className="fixed inset-0 z-[110] flex items-end bg-black/70 md:hidden">
          <div
            ref={sheetRef}
            id={`seller-contact-sheet-${car.id}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`seller-contact-sheet-title-${car.id}`}
            onKeyDown={(event) => {
              if (event.key !== "Tab") return;

              const focusableElements = sheetRef.current?.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
              );
              if (!focusableElements?.length) return;

              const firstElement = focusableElements[0];
              const lastElement = focusableElements[focusableElements.length - 1];
              if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
              } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
              }
            }}
            className="w-full rounded-t-[28px] border border-[#52657A] bg-[#0B1B25] px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 text-left shadow-[0_-18px_36px_rgba(0,0,0,0.42)]"
          >
            <div className="flex items-start justify-between gap-4">
              <p
                id={`seller-contact-sheet-title-${car.id}`}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
              >
                Contact seller
              </p>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  triggerRef.current?.focus();
                }}
                aria-label="Close contact seller"
                className="app-button -mt-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/15 text-slate-100 transition hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            {contactDetails}
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                triggerRef.current?.focus();
              }}
              className="app-button mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/8"
            >
              Close
            </button>
          </div>
        </div>,
        document.body,
      )
        : null}
    </div>
  );
}

export function CompareTable({
  cars,
  hasEligibleAdditionalLikedCar,
  onOpenNotes,
  onViewDetails,
  onRemoveFromEngage,
  maxCars = 3,
}: CompareTableProps) {
  const slots = Array.from({ length: maxCars }, (_, index) => cars[index] ?? null);
  const [carToUnpick, setCarToUnpick] = useState<CompareCar | null>(null);
  const [activeSellerContactCarId, setActiveSellerContactCarId] =
    useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCarToUnpick(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div>
      {cars.length > 1 ? (
        <p
          id="top-picks-scroll-hint"
          className="mb-2 flex items-center gap-1 px-1 text-sm font-medium text-slate-400 md:hidden"
        >
          Swipe to compare
          <ArrowRight size={16} aria-hidden="true" />
        </p>
      ) : null}
      <div
        role="region"
        tabIndex={0}
        aria-label="Top Picks comparison"
        aria-describedby={cars.length > 1 ? "top-picks-scroll-hint" : undefined}
        className="isolate overflow-x-auto scroll-smooth scroll-pl-[7.5rem] snap-x snap-proximity rounded-[22px] border border-white/8 bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#071018] md:scroll-pl-0 md:snap-none"
      >
        <table className="min-w-[52rem] w-full border-separate border-spacing-0 md:border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 w-[7.5rem] min-w-[7.5rem] border-b border-white/10 bg-[#0B1B25] px-4 py-5 text-left align-bottom text-base font-semibold uppercase tracking-[0.18em] text-slate-400 md:static md:w-40 md:min-w-0 md:bg-transparent">
              Compare
            </th>
            {slots.map((car, index) => (
              <th
                key={car?.id ?? `empty-slot-${index}`}
                className="w-60 min-w-60 snap-start border-b border-l border-white/10 px-4 py-5 text-left align-top md:w-auto md:min-w-0"
              >
                {car ? (
                  <div className={`space-y-3 ${isSoldListing(car) ? "opacity-[0.84] saturate-[0.82]" : ""}`}>
                    <TopPickImageCarousel car={car} />
                    <div>
                      {isSoldListing(car) ? (
                        <span className="mb-2 inline-flex rounded-full border border-slate-400/45 bg-slate-700/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white">
                          Sold
                        </span>
                      ) : null}
                      <p className="text-[1.3rem] font-semibold leading-tight text-white sm:text-[1.4rem]">
                        {car.name}
                      </p>
                      <p className="mt-1 text-2xl font-semibold leading-tight text-white sm:text-[1.5rem]">
                        {car.price}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onViewDetails(car.id)}
                        className={buyerCardActionClassName("secondary")}
                      >
                        <Eye size={20} strokeWidth={2.4} className="text-slate-200" />
                        View Details
                      </button>
                      {!isSoldListing(car) ? <SellerContactPopover
                        car={car}
                        isOpen={activeSellerContactCarId === car.id}
                        onOpenChange={(isOpen) =>
                          setActiveSellerContactCarId(isOpen ? car.id : null)
                        }
                      /> : null}
                      {!isSoldListing(car) ? <button
                        type="button"
                        onClick={() => onOpenNotes(car.id)}
                        className={buyerCardActionClassName("tertiary")}
                      >
                        <FileText size={20} strokeWidth={2.4} className="text-slate-200" />
                        Notes
                      </button> : null}
                      {!isSoldListing(car) ? <button
                        type="button"
                        onClick={() => setCarToUnpick(car)}
                        className={buyerCardActionClassName("neutral")}
                      >
                        <Heart
                          size={20}
                          strokeWidth={2.4}
                          className="fill-accent text-accent"
                          aria-hidden="true"
                        />
                        Unpick
                      </button> : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-[18px] border border-dashed border-white/10 bg-white/[0.02] px-4 text-center">
                    <p className="text-base font-semibold text-slate-200">Add another Top Pick</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {hasEligibleAdditionalLikedCar
                        ? "Choose one from your Liked cars."
                        : "Find another car you love."}
                    </p>
                    <Link
                      href={hasEligibleAdditionalLikedCar ? "/like" : "/discover"}
                      className={`mt-5 ${buyerCardActionClassName("secondary")}`}
                    >
                      {hasEligibleAdditionalLikedCar
                        ? "View Liked Cars"
                        : "Discover More Cars"}
                    </Link>
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={row.key}
              className={rowIndex % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"}
            >
              <th
                className={`sticky left-0 z-10 border-b border-white/10 px-4 py-3.5 text-left text-base font-semibold text-slate-400 md:static ${
                  rowIndex % 2 === 0
                    ? "bg-[#10202C] md:bg-transparent"
                    : "bg-[#0B1B25] md:bg-transparent"
                }`}
              >
                {row.label}
              </th>
              {slots.map((car, index) => (
                <td
                  key={`${car?.id ?? `empty-slot-${index}`}-${row.key}`}
                  className={`min-w-60 snap-start border-b border-l border-white/10 px-4 py-3.5 align-top text-lg leading-7 text-slate-100 md:min-w-0 ${
                    emphasizedRows.has(row.key) ? "font-semibold text-white" : "font-semibold"
                  }`}
                >
                  {car ? (
                    row.key === "price" ? (
                      <span className="font-semibold text-white">{car.price}</span>
                    ) : row.key === "mileage" ? (
                      car.mileage
                    ) : row.key === "year" ? (
                      car.year
                    ) : row.key === "plateSeries" ? (
                      car.plateSeries || <span className="text-slate-500">—</span>
                    ) : row.key === "fuel" ? (
                      car.fuel
                    ) : row.key === "transmission" ? (
                      car.transmission
                    ) : row.key === "engineSize" ? (
                      car.engineSize || <span className="text-slate-500">—</span>
                    ) : row.key === "colour" ? (
                      car.colour || <span className="text-slate-500">—</span>
                    ) : row.key === "negotiable" ? (
                      car.isNegotiable === undefined ? (
                        <span className="text-slate-500">—</span>
                      ) : car.isNegotiable ? (
                        "Yes"
                      ) : (
                        "No"
                      )
                    ) : row.key === "location" ? (
                      car.location
                    ) : row.key === "category" ? (
                      car.category || <span className="text-slate-500">—</span>
                    ) : car.notes ? (
                      car.notes
                    ) : (
                      <span className="text-slate-500">No notes added</span>
                    )
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        </table>
      </div>

      {carToUnpick ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="unpick-confirmation-title"
        >
          <div className="w-full max-w-sm rounded-[28px] border border-input bg-panel p-5 shadow-[0_28px_80px_rgba(0,0,0,0.52)]">
            <h2
              id="unpick-confirmation-title"
              className="text-xl font-semibold text-white"
            >
              Remove from Top Picks?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {carToUnpick.name} will return to your Liked cars.
            </p>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setCarToUnpick(null)}
                className="app-button rounded-full border border-input bg-input px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemoveFromEngage(carToUnpick.id);
                  setCarToUnpick(null);
                }}
                className="app-button inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                <Heart size={18} strokeWidth={2.4} fill="currentColor" />
                Unpick
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

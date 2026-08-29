"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRightLeft, FileText, Heart, Minus, Plus } from "lucide-react";

import { CompareTable } from "@/components/CompareTable";
import { BuyerEmptyState } from "@/components/BuyerEmptyState";
import { CarDetailsModal } from "@/components/CarDetailsModal";
import { InfoIconButton } from "@/components/InfoIconButton";
import { NotesModal } from "@/components/NotesModal";
import { SponsorCard } from "@/components/SponsorSupportLine";
import { useJourney } from "@/components/JourneyProvider";
import { useMounted } from "@/hooks/useMounted";
import { carIsAvailable, isSavedListingVisible } from "@/lib/matching";

export default function MatchPage() {
  const mounted = useMounted();
  const { activeInventoryCars, carProgress, setCarState, updateCarNotes } =
    useJourney();
  const [activeNotesCarId, setActiveNotesCarId] = useState<string | null>(null);
  const [activeDetailsCarId, setActiveDetailsCarId] = useState<string | null>(null);
  const [isTopPicksHelpOpen, setIsTopPicksHelpOpen] = useState(false);

  if (!mounted) {
    return null;
  }

  const matchedCars = activeInventoryCars
    .filter(
      (car) =>
        carProgress[car.id]?.state === "matched" &&
        isSavedListingVisible(car),
    )
    .slice(0, 3)
    .map((car) => ({
      ...car,
      notes: carProgress[car.id]?.notes ?? "",
    }));
  const hasEligibleAdditionalLikedCar = activeInventoryCars.some(
    (car) =>
      carProgress[car.id]?.state === "liked" && carIsAvailable(car),
  );
  const activeNotesCar = activeNotesCarId
    ? activeInventoryCars.find((car) => car.id === activeNotesCarId) ?? null
    : null;
  const activeDetailsCar = activeDetailsCarId
    ? activeInventoryCars.find((car) => car.id === activeDetailsCarId) ?? null
    : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-6 sm:px-7 lg:px-10 lg:py-8">
        {matchedCars.length ? (
          <section className="page-panel motion-rise-fade motion-delay-0 rounded-[26px] border border-input bg-panel p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-5">
            <div className="flex flex-col gap-4">
              <div className="max-w-3xl">
                <h1 className="flex items-center gap-3 text-3xl font-semibold text-white sm:text-4xl">
                  <Heart
                    size={28}
                    strokeWidth={0}
                    className="shrink-0 fill-current text-slate-200"
                    aria-hidden="true"
                  />
                  Compare Top Picks
                  <InfoIconButton
                    onClick={() => setIsTopPicksHelpOpen((current) => !current)}
                    aria-expanded={isTopPicksHelpOpen}
                    aria-label="How Compare Top Picks works"
                  >
                    <span aria-hidden="true" className="font-serif text-[1.3rem] font-bold italic leading-none">
                      i
                    </span>
                  </InfoIconButton>
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
                  See your top picks side by side to choose the right one.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/like"
                  className="app-button inline-flex w-fit items-center gap-2 rounded-xl border border-white/18 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/6"
                >
                  <ArrowLeft size={18} strokeWidth={2.4} aria-hidden="true" />
                  Back to Liked
                </Link>
              </div>
            </div>

            {isTopPicksHelpOpen ? (
              <div className="liked-help-panel mx-auto mt-5 w-full max-w-xl rounded-[28px] border border-white/10 bg-[#07141d] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.28)]">
                <h2 className="text-2xl font-semibold text-white">
                  How this works
                </h2>
                <div className="mt-5 space-y-4">
                  <div className="flex gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                      <ArrowRightLeft size={19} strokeWidth={2.4} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-lg font-semibold text-white">
                        Compare
                      </p>
                      <p className="mt-1 text-base leading-7 text-slate-300">
                        See your top picks side by side to spot the best fit.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/7 text-slate-200">
                      <FileText size={19} strokeWidth={2.4} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-lg font-semibold text-white">
                        Notes
                      </p>
                      <p className="mt-1 text-base leading-7 text-slate-300">
                        Capture quick thoughts so you don’t forget what stands out.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/7 text-slate-200">
                      <Minus size={19} strokeWidth={2.4} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-lg font-semibold text-white">
                        Refine
                      </p>
                      <p className="mt-1 text-base leading-7 text-slate-300">
                        Remove cars to narrow down to your final choice.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/7 text-slate-200">
                      <Plus size={19} strokeWidth={2.4} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-lg font-semibold text-white">
                        Add more
                      </p>
                      <p className="mt-1 text-base leading-7 text-slate-300">
                        Bring in another top pick if you want to compare more options.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mt-5 text-base font-medium leading-7 text-slate-400">
                  Your top picks are where decisions happen.
                </p>
                <button
                  type="button"
                  onClick={() => setIsTopPicksHelpOpen(false)}
                  className="app-button mt-5 inline-flex w-full justify-center rounded-full border border-white/15 bg-white/8 px-5 py-3 text-base font-semibold text-white transition hover:bg-white/12"
                >
                  Got it
                </button>
              </div>
            ) : null}

            <div className="mt-5">
              <SponsorCard
                sponsor="shield-insurance"
                title="Compare costs beyond the price"
                description="Get an insurance estimate for your Top Picks."
                cta="Estimate insurance"
              />
            </div>

            <div className="mt-5 rounded-[22px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.015)_0%,rgba(255,255,255,0.005)_100%)] p-1 sm:p-1.5">
              <CompareTable
                cars={matchedCars}
                hasEligibleAdditionalLikedCar={hasEligibleAdditionalLikedCar}
                onOpenNotes={setActiveNotesCarId}
                onViewDetails={setActiveDetailsCarId}
                onRemoveFromEngage={(carId) => setCarState(carId, "liked")}
              />
            </div>
          </section>
        ) : (
          <section className="page-panel motion-rise-fade motion-delay-0 overflow-hidden rounded-[26px] border border-input bg-panel shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <BuyerEmptyState illustrationIcon={Heart} illustrationLabel="Compare">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Your Top Picks · 0
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                  Nothing in Top Picks yet
                </h1>
                <p className="mt-3 max-w-lg text-base leading-relaxed text-slate-300 md:text-lg">
                  Move up to three favourites here to compare them side by side.
                </p>
                <Link
                  href="/like"
                  className="app-button mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  <ArrowLeft size={18} strokeWidth={2.4} aria-hidden="true" />
                  Go to Liked
                </Link>
            </BuyerEmptyState>
          </section>
        )}

      {activeNotesCar ? (
        <NotesModal
            carName={activeNotesCar.name}
            initialNotes={carProgress[activeNotesCar.id]?.notes ?? ""}
            onClose={() => setActiveNotesCarId(null)}
            onSave={(notes) => updateCarNotes(activeNotesCar.id, notes)}
          />
      ) : null}
      {activeDetailsCar ? (
        <CarDetailsModal
          car={activeDetailsCar}
          onClose={() => setActiveDetailsCarId(null)}
          showSellerContact={false}
        />
      ) : null}

      </div>
    </main>
  );
}

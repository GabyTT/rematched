"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";

import { CarDetailsModal } from "@/components/CarDetailsModal";
import { CompareTable } from "@/components/CompareTable";
import { NotesModal } from "@/components/NotesModal";
import { SponsorCard } from "@/components/SponsorSupportLine";
import { useJourney } from "@/components/JourneyProvider";
import { useMounted } from "@/hooks/useMounted";
import { cars } from "@/lib/cars";

export default function MatchPage() {
  const mounted = useMounted();
  const { carProgress, setCarState, updateCarNotes } = useJourney();
  const [activeNotesCarId, setActiveNotesCarId] = useState<string | null>(null);
  const [activeDetailsCarId, setActiveDetailsCarId] = useState<string | null>(
    null,
  );

  if (!mounted) {
    return null;
  }

  const matchedCars = cars
    .filter((car) => carProgress[car.id]?.state === "matched")
    .slice(0, 3)
    .map((car) => ({
      ...car,
      notes: carProgress[car.id]?.notes ?? "",
    }));
  const activeNotesCar = activeNotesCarId
    ? cars.find((car) => car.id === activeNotesCarId) ?? null
    : null;
  const activeDetailsCar = activeDetailsCarId
    ? cars.find((car) => car.id === activeDetailsCarId) ?? null
    : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        {matchedCars.length ? (
          <section className="page-panel motion-rise-fade motion-delay-0 rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-3xl">
                <h1 className="flex items-center gap-3 text-3xl font-semibold text-white sm:text-4xl">
                  <Heart
                    size={28}
                    strokeWidth={0}
                    className="shrink-0 fill-current text-slate-200"
                    aria-hidden="true"
                  />
                  Compare Top Picks
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
                  See your top picks side by side to choose the right one.
                </p>
              </div>
              <Link
                href="/like"
                className="app-button inline-flex w-fit rounded-full border border-white/18 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/6"
              >
                Back to Liked
              </Link>
            </div>

            <div className="mt-5">
              <SponsorCard
                sponsor="shield-insurance"
                title="Compare costs beyond the price"
                description="Check the practical costs around your final choice."
                cta="Estimate insurance"
              />
            </div>

            <div className="mt-6 rounded-[24px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.015)_0%,rgba(255,255,255,0.005)_100%)] p-1.5 sm:p-2">
              <CompareTable
                cars={matchedCars}
                onViewDetails={setActiveDetailsCarId}
                onOpenNotes={setActiveNotesCarId}
                onRemoveFromEngage={(carId) => setCarState(carId, "liked")}
              />
            </div>
          </section>
        ) : (
          <section className="page-panel motion-rise-fade motion-delay-0 rounded-[28px] border border-dashed border-input bg-panel p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <h1 className="flex items-center justify-center gap-3 text-3xl font-semibold text-white sm:text-4xl">
              <Heart
                size={28}
                strokeWidth={0}
                className="shrink-0 fill-current text-slate-200"
                aria-hidden="true"
              />
              Compare Top Picks
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
              See your top picks side by side to choose the right one.
            </p>
            <h2 className="mt-6 text-2xl font-semibold text-white">
              No Top Picks yet
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
              Move up to 3 cars from Liked into Top Picks to compare them side by side.
            </p>
            <Link
              href="/like"
              className="app-button mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Go to Liked
            </Link>
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
          />
        ) : null}
      </div>
    </main>
  );
}

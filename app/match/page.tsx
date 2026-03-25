"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FileText,
  GitCompare,
  MessageCircle,
} from "lucide-react";

import { CarBrowseActions } from "@/components/CarBrowseActions";
import { CarCard } from "@/components/CarCard";
import { CarDetailsModal } from "@/components/CarDetailsModal";
import { CompareTable } from "@/components/CompareTable";
import { NotesModal } from "@/components/NotesModal";
import { useJourney } from "@/components/JourneyProvider";
import { useMounted } from "@/hooks/useMounted";
import { cars } from "@/lib/cars";
import { hasValidBudgetRange } from "@/lib/matching";

const budgetFormatter = new Intl.NumberFormat("en-US");
const formatBudgetRange = (minBudget: number | null, maxBudget: number | null) =>
  minBudget !== null && maxBudget !== null
    ? `${budgetFormatter.format(minBudget)}-${budgetFormatter.format(maxBudget)} TTD`
    : "Not set";

export default function MatchPage() {
  const mounted = useMounted();
  const {
    carProgress,
    compareCarIds,
    preferences,
    setCarState,
    toggleCompareCar,
    updateCarNotes,
  } = useJourney();
  const [activeNotesCarId, setActiveNotesCarId] = useState<string | null>(null);
  const [contactCarId, setContactCarId] = useState<string | null>(null);
  const [activeDetailsCarId, setActiveDetailsCarId] = useState<string | null>(
    null,
  );

  if (!mounted) {
    return null;
  }

  const matchedCars = cars.filter(
    (car) => carProgress[car.id]?.state === "matched",
  );
  const compareCars = cars
    .filter((car) => compareCarIds.includes(car.id))
    .map((car) => ({
      ...car,
      notes: carProgress[car.id]?.notes ?? "",
    }));
  const activeNotesCar = activeNotesCarId
    ? cars.find((car) => car.id === activeNotesCarId) ?? null
    : null;
  const contactCar = contactCarId
    ? cars.find((car) => car.id === contactCarId) ?? null
    : null;
  const activeDetailsCar = activeDetailsCarId
    ? cars.find((car) => car.id === activeDetailsCarId) ?? null
    : null;
  const hasBudgetRange = hasValidBudgetRange(preferences);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-10">
        <section className="page-panel motion-rise-fade motion-delay-0 rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
            ENGAGE stage
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Move from interest to contact
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            When you are ready, send your shortlist to a seller or advisor and
            keep the momentum going.
          </p>

          {matchedCars.length ? (
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
              {matchedCars.map((car) => (
                <CarCard
                  key={car.id}
                  {...car}
                  indicator={
                    carProgress[car.id]?.notes ? (
                      <p className="inline-flex items-center gap-2 text-sm text-slate-300">
                        <FileText size={16} className="text-slate-300" />
                        Notes added
                      </p>
                    ) : null
                  }
                  footer={
                    <div className="flex flex-wrap gap-3">
                      <CarBrowseActions
                        onViewDetails={() => setActiveDetailsCarId(car.id)}
                        onLike={() => setCarState(car.id, "liked")}
                        onPass={() => setCarState(car.id, "rejected")}
                      />
                      <button
                        type="button"
                        onClick={() => setContactCarId(car.id)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent"
                      >
                        <MessageCircle size={18} className="text-slate-300" />
                        Start Conversation
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCompareCar(car.id)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-input bg-input px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent"
                      >
                        <GitCompare size={18} className="text-slate-300" />
                        {compareCarIds.includes(car.id)
                          ? "Compare Selected"
                          : "Compare"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveNotesCarId(car.id)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-input bg-input px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent"
                      >
                        <FileText size={18} className="text-slate-300" />
                        Notes
                      </button>
                    </div>
                  }
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[24px] border border-dashed border-input bg-input/60 p-5">
              <h2 className="text-xl font-semibold text-white">
                No cars in Engage yet
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Move cars from Like into Engage before contacting a seller or
                comparing finalists.
              </p>
              <Link
                href="/like"
                className="app-button mt-5 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Go to Like
              </Link>
            </div>
          )}
        </section>

        <section className="page-panel motion-rise-fade motion-delay-1 rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                Ready to send
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Shortlist summary
              </h2>
            </div>
            <Link
              href="/like"
              className="app-button inline-flex rounded-full border border-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent"
            >
              Edit shortlist
            </Link>
          </div>

          <div className="mt-6 rounded-[24px] border border-input bg-input/70 p-5">
            <h2 className="text-xl font-semibold text-white">
              Engagement package
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Contacting a seller is unlocked only after a car reaches Engage.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-input bg-panel p-4">
                <p className="text-sm text-slate-400">Budget range</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {hasBudgetRange
                    ? formatBudgetRange(
                        preferences.minBudget,
                        preferences.maxBudget,
                      )
                    : "Not set"}
                </p>
              </div>
              <div className="rounded-2xl border border-input bg-panel p-4">
                <p className="text-sm text-slate-400">Matched vehicles</p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {matchedCars.length}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {compareCars.length >= 2 ? (
              <CompareTable
                cars={compareCars}
                onMoveToLike={(carId) => setCarState(carId, "liked")}
                onReject={(carId) => setCarState(carId, "rejected")}
                onKeepMatched={(carId) => setCarState(carId, "matched")}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-input bg-input/60 px-4 py-5">
                <p className="text-sm leading-6 text-slate-300">
                  Select 2 to 3 matched cars with Compare to see them side by
                  side here.
                </p>
              </div>
            )}
          </div>
        </section>

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

        {contactCar ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5">
            <div className="w-full max-w-lg rounded-[28px] border border-input bg-panel p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    Start Conversation
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Start the conversation for {contactCar.name}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setContactCarId(null)}
                  className="rounded-full border border-input bg-input px-3 py-2 text-sm font-medium text-white transition hover:border-accent"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                <input
                  className="app-input min-h-12 rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none placeholder:text-slate-400"
                  placeholder="Your name"
                />
                <input
                  className="app-input min-h-12 rounded-2xl border border-input bg-input px-4 text-sm text-white outline-none placeholder:text-slate-400"
                  placeholder="Email or phone"
                />
                <textarea
                  rows={5}
                  className="app-input rounded-3xl border border-input bg-input p-4 text-sm text-white outline-none placeholder:text-slate-400"
                  placeholder="Hi, I’m interested in this vehicle and would like to learn more."
                />
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setContactCarId(null)}
                  className="app-button rounded-full border border-input bg-input px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setContactCarId(null)}
                  className="app-button inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  <MessageCircle size={18} className="text-slate-300" />
                  Send Inquiry
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

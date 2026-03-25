"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText, Heart, ThumbsDown } from "lucide-react";

import { CarCard } from "@/components/CarCard";
import { NotesModal } from "@/components/NotesModal";
import { useJourney } from "@/components/JourneyProvider";
import { useMounted } from "@/hooks/useMounted";
import { cars } from "@/lib/cars";

export default function LikePage() {
  const mounted = useMounted();
  const { carProgress, setCarState, updateCarNotes } = useJourney();
  const [activeNotesCarId, setActiveNotesCarId] = useState<string | null>(null);

  if (!mounted) {
    return null;
  }

  const likedCars = cars.filter((car) => carProgress[car.id]?.state === "liked");
  const activeNotesCar = activeNotesCarId
    ? cars.find((car) => car.id === activeNotesCarId) ?? null
    : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <section className="page-panel motion-rise-fade motion-delay-0 rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
            LIKE stage
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Review your shortlist
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            The cars you saved in Discover show up here so you can compare them
            before reaching out.
          </p>
        </section>

        {likedCars.length ? (
          <section className="space-y-5">
            <div className="page-panel motion-rise-fade motion-delay-1 flex flex-col gap-4 rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:flex-row sm:items-end sm:justify-between sm:p-6">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">
                  Saved cars
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Your shortlist
                </h2>
              </div>
              <Link
                href="/match"
                className="app-button inline-flex w-fit items-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Continue to Engage
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {likedCars.map((car) => (
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
                      <button
                        type="button"
                        onClick={() => setCarState(car.id, "rejected")}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-input bg-input px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent"
                      >
                        <ThumbsDown size={18} className="text-slate-300" />
                        Pass
                      </button>
                      <button
                        type="button"
                        onClick={() => setCarState(car.id, "matched")}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent"
                      >
                        <Heart size={18} className="text-red-500" />
                        Engage
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
          </section>
        ) : (
          <section className="rounded-[28px] border border-dashed border-input bg-panel p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <h2 className="text-2xl font-semibold text-white">
              Your shortlist is empty
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Save a few cars in Discover and come back here to compare them.
            </p>
            <Link
              href="/discover"
              className="app-button mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Go to Discover
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
      </div>
    </main>
  );
}

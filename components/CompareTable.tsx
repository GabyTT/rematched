"use client";

import Image from "next/image";
import { Eye, FileText, Heart } from "lucide-react";
import { useEffect, useState } from "react";

import type { Car } from "@/lib/cars";

type CompareCar = Car & {
  notes: string;
};

type CompareTableProps = {
  cars: CompareCar[];
  onViewDetails: (carId: string) => void;
  onOpenNotes: (carId: string) => void;
  onRemoveFromEngage: (carId: string) => void;
  maxCars?: number;
};

const rows: Array<{
  key:
    | "price"
    | "mileage"
    | "year"
    | "fuel"
    | "transmission"
    | "location"
    | "notes";
  label: string;
}> = [
  { key: "price", label: "Price" },
  { key: "mileage", label: "Mileage" },
  { key: "year", label: "Year" },
  { key: "fuel", label: "Fuel" },
  { key: "transmission", label: "Transmission" },
  { key: "location", label: "Location" },
  { key: "notes", label: "Notes" },
];

const emphasizedRows = new Set(["price", "mileage", "year"]);

export function CompareTable({
  cars,
  onViewDetails,
  onOpenNotes,
  onRemoveFromEngage,
  maxCars = 3,
}: CompareTableProps) {
  const slots = Array.from({ length: maxCars }, (_, index) => cars[index] ?? null);
  const [carToUnpick, setCarToUnpick] = useState<CompareCar | null>(null);

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
    <div className="overflow-x-auto rounded-[22px] border border-white/8 bg-transparent">
      <table className="min-w-[52rem] w-full border-collapse">
        <thead>
          <tr>
            <th className="w-40 border-b border-white/10 px-4 py-5 text-left align-bottom text-base font-semibold uppercase tracking-[0.18em] text-slate-400">
              Compare
            </th>
            {slots.map((car, index) => (
              <th
                key={car?.id ?? `empty-slot-${index}`}
                className="border-b border-l border-white/10 px-4 py-5 text-left align-top"
              >
                {car ? (
                  <div className="space-y-3">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-[18px]">
                      <Image
                        src={car.image}
                        alt={car.name}
                        fill
                        sizes="(max-width: 767px) 80vw, 28vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    </div>
                    <div>
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
                        className="app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/18 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-white/35 hover:bg-white/6 hover:text-white"
                      >
                        <Eye size={20} strokeWidth={2.4} className="text-slate-200" />
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenNotes(car.id)}
                        className="app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/18 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-white/35 hover:bg-white/6 hover:text-white"
                      >
                        <FileText size={20} strokeWidth={2.4} className="text-slate-200" />
                        Notes
                      </button>
                      <button
                        type="button"
                        onClick={() => setCarToUnpick(car)}
                        className="app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-400 transition hover:border-white/20 hover:bg-white/4 hover:text-slate-200"
                      >
                        <Heart
                          size={20}
                          strokeWidth={2.4}
                          className="fill-accent text-accent"
                          aria-hidden="true"
                        />
                        Unpick
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[20rem] flex-col items-center justify-center rounded-[18px] border border-dashed border-white/10 bg-white/[0.02] px-4 text-center">
                    <p className="text-base font-semibold text-white">Add another top pick</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Add another car to compare up to 3 top picks side by side.
                    </p>
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
              <th className="border-b border-white/10 px-4 py-3.5 text-left text-base font-semibold text-slate-400">
                {row.label}
              </th>
              {slots.map((car, index) => (
                <td
                  key={`${car?.id ?? `empty-slot-${index}`}-${row.key}`}
                  className={`border-b border-l border-white/10 px-4 py-3.5 align-top text-lg leading-7 text-slate-100 ${
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
                    ) : row.key === "fuel" ? (
                      car.fuel
                    ) : row.key === "transmission" ? (
                      car.transmission
                    ) : row.key === "location" ? (
                      car.location
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

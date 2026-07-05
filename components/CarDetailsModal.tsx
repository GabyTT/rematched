"use client";

import { useEffect } from "react";

import type { Car } from "@/lib/cars";

type CarDetailsModalProps = {
  car: Car;
  onClose: () => void;
};

export function CarDetailsModal({ car, onClose }: CarDetailsModalProps) {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5">
      <div className="w-full max-w-2xl rounded-[28px] border border-input bg-panel p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
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

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
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
      </div>
    </div>
  );
}
